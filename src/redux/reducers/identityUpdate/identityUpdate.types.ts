export const SET_TXID = 'SET_TXID' as const;

export type TxidActionTypes = typeof SET_TXID;

// Action interfaces
export interface SetTxidAction {
  type: typeof SET_TXID;
  payload: string;
}

export type TxidAction = SetTxidAction;

// State interface
export interface TxidState {
  txid: string;
}
