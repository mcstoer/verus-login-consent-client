import { IdentityUpdateResponse } from 'verus-typescript-primitives';

export const SET_TXID = 'SET_TXID' as const;
export const SET_RESPONSE = 'SET_RESPONSE' as const;

export type TxidActionTypes = typeof SET_TXID | typeof SET_RESPONSE;

// Action interfaces
export interface SetTxidAction {
  type: typeof SET_TXID;
  payload: string;
}

export interface SetResponseAction {
  type: typeof SET_RESPONSE;
  payload: IdentityUpdateResponse;
}

export type TxidAction = SetTxidAction | SetResponseAction;

// State interface
export interface TxidState {
  txid: string;
  response: IdentityUpdateResponse | null;
}
