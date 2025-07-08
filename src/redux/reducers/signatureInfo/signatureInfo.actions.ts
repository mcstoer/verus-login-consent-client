import { SET_SIGNATURE_INFO } from './signatureInfo.types';

export const setSignatureInfo = (signatureInfo) => ({
  type: SET_SIGNATURE_INFO,
  payload: signatureInfo
});