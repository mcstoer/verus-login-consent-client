import { 
  SET_SIGNATURE_INFO,
  SetSignatureInfoAction,
  Identity,
  BlockInfo
} from './signatureInfo.types';

export const setSignatureInfo = (signatureInfo: {
  signedBy?: Identity;
  sigBlockInfo?: BlockInfo;
  signingRevocationIdentity?: Identity;
  signingRecoveryIdentity?: Identity;
}): SetSignatureInfoAction => ({
  type: SET_SIGNATURE_INFO,
  payload: signatureInfo
});