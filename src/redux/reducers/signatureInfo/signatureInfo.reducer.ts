/*
  This reducer contains the signature information of the deeplink data.
*/
import { SET_SIGNATURE_INFO, SignatureInfoState, SignatureInfoAction } from './signatureInfo.types';

const initialState: SignatureInfoState = {
  signedBy: null,
  sigBlockInfo: null,
  signingRevocationIdentity: null,
  signingRecoveryIdentity: null
};

export const signatureInfo = (state = initialState, action: SignatureInfoAction): SignatureInfoState => {
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