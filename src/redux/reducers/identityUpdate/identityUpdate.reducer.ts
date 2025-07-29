/*
  This reducer contains information for identity update requests.
*/
import {
  SET_TXID,
  SET_RESPONSE,
  TxidState,
  TxidAction
} from './identityUpdate.types';

const initialState: TxidState = {
  txid: '',
  response: null,
};

export const identityUpdate = (state = initialState, action: TxidAction): TxidState => {
  switch (action.type) {
  case SET_TXID:
    return {
      ...state,
      txid: action.payload
    };
  case SET_RESPONSE:
    return {
      ...state,
      response: action.payload
    };
  default:
    return state;
  }
};

export default identityUpdate;
