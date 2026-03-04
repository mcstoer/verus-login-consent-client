import {setActiveVerusId} from '#/redux/reducers/identity/identity.actions';
import {AppDispatch, RootState} from '#/redux/store';
import {executeIdentityUpdateRequest} from '#/rpc/calls/executeIdentityUpdateRequest';
import {Identity} from '#/types/identity';
import {
  GenericRequest,
  IdentityUpdateRequestOrdinalVDXFObject,
  IdentityUpdateResponseDetails,
  IdentityUpdateResponseOrdinalVDXFObject,
} from 'verus-typescript-primitives';

export async function prepareIdentityUpdateDetail(
  ordinal: IdentityUpdateRequestOrdinalVDXFObject,
  _detailIndex: number,
  dispatch: AppDispatch,
  getState: () => RootState
): Promise<void> {
  if (!(ordinal instanceof IdentityUpdateRequestOrdinalVDXFObject)) {
    throw new Error('Unable to handle non-identity update detail.');
  }

  const detail = ordinal.data;

  if (!detail.identity) {
    throw new Error('Invalid identity update detail: missing identity.');
  }

  const state = getState();
  const identities = state.identity.identities as Identity[];
  const detailIdentityName = detail.identity.name;

  const matchingIdentity = identities.find(id => id.identity.name === detailIdentityName);

  if (!matchingIdentity) {
    throw new Error(`No identity found for "${detailIdentityName}" in the available identities.`);
  }

  // We need an active identity to sign the response with.
  // If there is no authentication detail to set the active identity, then use the
  // identity being updated.
  if (!state.identity.activeIdentity) {
    dispatch(setActiveVerusId(matchingIdentity));
  }
}

export async function generateIdentityUpdateResponse(
  request: GenericRequest,
  detailIndex: number,
  getState: () => RootState
) {
  const ordinalWrapper = request.details[detailIndex];
  const state = getState();
  const chainId = state.chainMetadata.chainId;

  if (!(ordinalWrapper instanceof IdentityUpdateRequestOrdinalVDXFObject)) {
    throw new Error('Detail is not an IdentityUpdateRequestOrdinalVDXFObject');
  }

  const detail = ordinalWrapper.data;

  // This will throw an error on failure.
  const txid = await executeIdentityUpdateRequest(chainId, detail);

  const responseDetail = new IdentityUpdateResponseDetails({
    txid: Buffer.from(txid, 'hex').reverse(),
    requestID: detail.requestID,
  });

  const responseOrdinal = new IdentityUpdateResponseOrdinalVDXFObject({
    data: responseDetail,
  });

  return responseOrdinal;
}
