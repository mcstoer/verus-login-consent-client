import {detailAdded, selectDetailById} from '#/redux/reducers/genericRequest/userDataSlice';
import {Identity} from '#/redux/reducers/signatureInfo/signatureInfo.types';
import {AppDispatch, RootState} from '#/redux/store';
import {getCredentialsByScope} from '#/rpc/calls/getCredentials';
import {serializeToBuffer} from '#/utils/buffer';
import {
  Credential,
  CredentialJson,
  DataDescriptor,
  DataPacketResponseOrdinalVDXFObject,
  GenericRequest,
  UserDataRequestOrdinalVDXFObject,
} from 'verus-typescript-primitives';
// The DataPacketResponse isn't exported the same as the other classes.
import {DataPacketResponse} from 'verus-typescript-primitives/dist/vdxf/classes/datapacket/DataPacketResponse';

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
  // TODO: Use AppOrDelegatedId when possible.
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

  try {
    const retrieved = await getCredentialsByScope(chainId, currentAddress, scopeAddress, vdxfkeys);

    for (const cred of retrieved) {
      const credential = new Credential(cred);
      credentialsJSON.push(credential.toJson());
    }

    dispatch(detailAdded({index, data: credentialsJSON}));
  } catch (error) {
    console.error('Error fetching credentials:', error);
  }
}

export function generateUserDataResponse(
  request: GenericRequest,
  detailIndex: number,
  getState: () => RootState
): DataPacketResponseOrdinalVDXFObject | null {
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

  console.log('Generating user data response from state:', {
    detailIndex,
    credentialCount: userData.data.length,
  });

  // Write the array of serializable objects to a single buffer.
  // The keys are comma-separated and should be used to deserialize the data.
  const storedData = userData.data.map(credential => Credential.fromJson(credential));
  const vdxfkeys = userDataRequestDetail.searchDataKey.flatMap(obj => Object.keys(obj));
  const commaJoinedKeys = vdxfkeys.join(',');

  const dataDescriptor = new DataDescriptor({
    version: DataDescriptor.DEFAULT_VERSION,
    objectdata: serializeToBuffer(storedData),
    label: commaJoinedKeys,
  });

  const dataPacketResponse = new DataPacketResponse({
    requestID: userDataRequestDetail.requestID,
    data: dataDescriptor,
  });

  const responseOrdinal = new DataPacketResponseOrdinalVDXFObject({
    data: dataPacketResponse,
  });

  return responseOrdinal;
}
