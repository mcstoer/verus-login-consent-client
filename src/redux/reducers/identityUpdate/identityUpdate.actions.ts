import {
  SET_TXID,
  SET_RESPONSE,
  SetTxidAction,
  SetResponseAction
} from './identityUpdate.types';
// @ts-expect-error: the IdentityUpdateRequest was removed and needs to be re-added when the generic request is fully implemented.
import { IdentityUpdateResponse } from 'verus-typescript-primitives';

export const setIdentityUpdateTxid = (txid: string): SetTxidAction => ({
  type: SET_TXID,
  payload: txid
});

export const setIdentityUpdateResponse = (response: IdentityUpdateResponse): SetResponseAction => ({
  type: SET_RESPONSE,
  payload: response
});
