import {Identity} from '#/redux/reducers/signatureInfo/signatureInfo.types';
import {AppDispatch, RootState} from '#/redux/store';
import {GenericRequest, IdentityUpdateRequestOrdinalVDXFObject} from 'verus-typescript-primitives';

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

export function generateIdentityUpdateResponse(request: GenericRequest, detailIndex: number) {
  const ordinalWrapper = request.details[detailIndex];

  if (!(ordinalWrapper instanceof IdentityUpdateRequestOrdinalVDXFObject)) {
    throw new Error('Detail is not an IdentityUpdateRequestOrdinalVDXFObject');
  }

  // TODO: Execute the update here.
  console.log('Identity update response generation not yet implemented:', {
    detailIndex,
  });

  // Create the response detail with the txid and requestid if there is one

  return null;
}
