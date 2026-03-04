import {BlockInfo, Identity} from '#/types/identity';

export type {BlockInfo, Identity};

export const SET_SIGNATURE_INFO = 'SET_SIGNATURE_INFO' as const;

export type SignatureInfoActionTypes = typeof SET_SIGNATURE_INFO;

export interface SetSignatureInfoAction {
  type: typeof SET_SIGNATURE_INFO;
  payload: {
    signedBy?: Identity;
    sigBlockInfo?: BlockInfo;
    signingRevocationIdentity?: Identity;
    signingRecoveryIdentity?: Identity;
  };
}

export type SignatureInfoAction = SetSignatureInfoAction;

export interface SignatureInfoState {
  signedBy: Identity | null;
  sigBlockInfo: BlockInfo | null;
  signingRevocationIdentity: Identity | null;
  signingRecoveryIdentity: Identity | null;
}
