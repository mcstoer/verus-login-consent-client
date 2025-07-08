/*
  This reducer contains the signature information of the deeplink data.
*/
import { SET_SIGNATURE_INFO } from './signatureInfo.types';

const initialState = {
  signedBy: null,
  sigBlockInfo: null,
  signingRevocationIdentity: null,
  signingRecoveryIdentity: null
};

const signatureInfo = (state = initialState, action) => {
  switch (action.type) {
  case SET_SIGNATURE_INFO:
    return {
      ...state,
      ...action.payload
    };
  default:
    return state;
  }
};

export default signatureInfo;