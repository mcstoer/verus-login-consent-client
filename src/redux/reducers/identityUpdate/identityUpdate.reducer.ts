/*
  This reducer contains information for identity update requests.
*/
import {
  SET_TXID,
  TxidState,
  TxidAction
} from './identityUpdate.types';

const initialState: TxidState = {
  txid: '',
};

export const identityUpdate = (state = initialState, action: TxidAction): TxidState => {
  switch (action.type) {
  case SET_TXID:
    return {
      ...state,
      txid: action.payload
    };
  default:
    return state;
  }
};

export default identityUpdate;
