import {detailAdded, selectDetailById} from '#/redux/reducers/genericRequest/userDataSlice';
import {Identity} from '#/redux/reducers/signatureInfo/signatureInfo.types';
import {AppDispatch, RootState} from '#/redux/store';
import {getCredentialsByScope} from '#/rpc/calls/getCredentials';
import {
  Credential,
  CredentialJson,
  DataDescriptor,
  DataPacketResponseOrdinalVDXFObject,
  GenericRequest,
  UserDataRequestOrdinalVDXFObject,
} from 'verus-typescript-primitives';
import {DetailResponseGenerator} from './types';
// The DataPacketResponse isn't exported the same as the other classes.
import {DataPacketResponse} from 'verus-typescript-primitives/dist/vdxf/classes/datapacket/DataPacketResponse';

// Fetch the data from the identity and put it in the redux store.
export async function prepareUserDataDetail(
  ordinal: UserDataRequestOrdinalVDXFObject,
  dispatch: AppDispatch,
  getState: () => RootState
): Promise<void> {
  const state = getState();
  const identity = state.identity;
  const chainId = state.chainMetadata.chainId;
  // TODO: Use AppOrDelegatedId when possible.
  const scopeIdentity = state.signatureInfo.signedBy;
  const index = state.navigation.currentDetailIndex;
  const currentIdentity = identity.activeIdentity as Identity;
  const currentAddress = currentIdentity.identityaddress;
  const scopeAddress = scopeIdentity.identityaddress;

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

  // TODO: Figure out what to do for credentials that don't fetch
  for (const key of vdxfkeys) {
    const retrieved = (await getCredentialsByScope(
      chainId,
      currentAddress,
      scopeAddress,
      key
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    )) as Array<any>;
    for (const cred of retrieved) {
      const credential = new Credential(cred);
      credentialsJSON.push(credential.toJson());
    }
  }

  dispatch(detailAdded({index, data: credentialsJSON}));

  return;
}

export const generateUserDataResponse: DetailResponseGenerator = (
  request: GenericRequest,
  detailIndex: number,
  getState: () => RootState
) => {
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

  const storedData = userData.data.map(credential => Credential.fromJson(credential));

  // TODO: Write the buffer into an array.
  // There is no current documented way of how to send an array, so just send the first
  // credential for now.
  const vdxfkeys = userDataRequestDetail.searchDataKey.flatMap(obj => Object.keys(obj));

  const dataDescriptor = new DataDescriptor({
    version: DataDescriptor.DEFAULT_VERSION,
    objectdata: storedData[0].toBuffer(),
    label: vdxfkeys[0],
  });

  const dataPacketResponse = new DataPacketResponse({
    requestID: userDataRequestDetail.requestID,
    data: dataDescriptor,
  });

  const responseOrdinal = new DataPacketResponseOrdinalVDXFObject({
    data: dataPacketResponse,
  });

  return responseOrdinal;
};
