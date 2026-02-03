import {Identity} from '#/redux/reducers/signatureInfo/signatureInfo.types';
import {AppDispatch, RootState} from '#/redux/store';
import {executeIdentityUpdateRequest} from '#/rpc/calls/executeIdentityUpdateRequest';
import {
  GenericRequest,
  IdentityUpdateRequestOrdinalVDXFObject,
  IdentityUpdateResponseDetails,
  IdentityUpdateResponseOrdinalVDXFObject,
} from 'verus-typescript-primitives';

export async function prepareIdentityUpdateDetail(
  ordinal: IdentityUpdateRequestOrdinalVDXFObject,
  _detailIndex: number,
  _dispatch: AppDispatch,
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
  const activeIdentity = state.identity.activeIdentity as Identity;

  if (!activeIdentity) {
    throw new Error('No active identity in state');
  }

  const stateIdentityName = activeIdentity.identity.name;
  const detailIdentityName = detail.identity.name;

  if (stateIdentityName !== detailIdentityName) {
    throw new Error(
      `The selected identity is "${stateIdentityName}", but the identity update is for "${detailIdentityName}"`
    );
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

  // This will throw an error on failure
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
