import {detailAdded, selectDetailById} from '#/redux/reducers/genericRequest/userDataSlice';
import {Identity} from '#/redux/reducers/signatureInfo/signatureInfo.types';
import {AppDispatch, RootState} from '#/redux/store';
import {getCredentialsByScope} from '#/rpc/calls/getCredentials';
import {
  Credential,
  CredentialJson,
  DATA_TYPE_OBJECT_CREDENTIAL,
  DataDescriptor,
  DataResponseDetails,
  DataResponseOrdinalVDXFObject,
  GenericRequest,
  UserDataRequestOrdinalVDXFObject,
  VdxfUniValue,
} from 'verus-typescript-primitives';

// Fetch the data from the identity and put it in the redux store.
export async function prepareUserDataDetail(
  ordinal: UserDataRequestOrdinalVDXFObject,
  detailIndex: number,
  dispatch: AppDispatch,
  getState: () => RootState
): Promise<void> {
  const state = getState();
  const identity = state.identity;

  // Check if data already exists for this detail index to prevent refetching since it takes time.
  const existingDetail = selectDetailById(state, detailIndex);
  if (existingDetail && existingDetail.data && existingDetail.data.length > 0) {
    return;
  }

  const chainId = state.chainMetadata.chainId;
  const request = state.deeplink.data as GenericRequest;
  const scopeIdentity = state.signatureInfo.signedBy;
  const index = detailIndex;
  const currentIdentity = identity.activeIdentity as Identity;
  const currentAddress = currentIdentity.identity.identityaddress;
  const scopeAddress = scopeIdentity.identity.identityaddress;

  if (!(ordinal instanceof UserDataRequestOrdinalVDXFObject)) {
    throw new Error('Unable to handle non-user data detail');
  }

  const detail = ordinal.data;

  if (!detail.isValid()) {
    throw new Error('Invalid user data detail');
  }

  // Only handle credentials for now, since there is no guidelines for other types.
  const credentialsJSON: CredentialJson[] = [];

  const vdxfkeys = detail.searchDataKey.flatMap(obj => Object.keys(obj));

  // If the request has invalid appOrDelegatedID, then an error should have be already thrown.
  const scope = request.appOrDelegatedID ? request.appOrDelegatedID.toIAddress() : scopeAddress;

  try {
    const retrieved = await getCredentialsByScope(chainId, currentAddress, scope, vdxfkeys);

    for (const cred of retrieved) {
      const credential = new Credential(cred);
      credentialsJSON.push(credential.toJson());
    }

    dispatch(detailAdded({index, data: credentialsJSON}));
  } catch (error) {
    console.error('Error fetching credentials:', error);
  }
}

export async function generateUserDataResponse(
  request: GenericRequest,
  detailIndex: number,
  getState: () => RootState
): Promise<DataResponseOrdinalVDXFObject | null> {
  const state = getState();
  const ordinalWrapper = request.details[detailIndex];

  if (!(ordinalWrapper instanceof UserDataRequestOrdinalVDXFObject)) {
    throw new Error('Detail is not a UserDataRequestOrdinalVDXFObject');
  }

  const userDataRequestDetail = ordinalWrapper.data;

  const userData = selectDetailById(state, detailIndex);

  if (!userData || !userData.data || userData.data.length === 0) {
    console.warn('No user data available for detail index:', detailIndex);
    return null;
  }

  // Write the array of serializable objects to a single buffer.
  // The keys are comma-separated and should be used to deserialize the data.
  const storedData = userData.data.map(credential => Credential.fromJson(credential));
  //const vdxfkeys = userDataRequestDetail.searchDataKey.flatMap(obj => Object.keys(obj));

  const values = storedData.map(credential => {
    return {[DATA_TYPE_OBJECT_CREDENTIAL.vdxfid]: credential};
  });

  const vdxfUniValue = new VdxfUniValue({
    values,
  });

  const dataDescriptor = new DataDescriptor({
    version: DataDescriptor.DEFAULT_VERSION,
    objectdata: vdxfUniValue.toBuffer(),
  });

  const dataPacketResponse = new DataResponseDetails({
    requestID: userDataRequestDetail.requestID,
    data: dataDescriptor,
  });

  const responseOrdinal = new DataResponseOrdinalVDXFObject({
    data: dataPacketResponse,
  });

  return responseOrdinal;
}
