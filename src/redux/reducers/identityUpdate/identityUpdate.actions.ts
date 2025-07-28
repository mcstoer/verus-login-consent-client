import {
  SET_TXID,
  SetTxidAction
} from './identityUpdate.types';

export const setIdentityUpdateTxid = (txid: string): SetTxidAction => ({
  type: SET_TXID,
  payload: txid
});
