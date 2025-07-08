export const SET_SIGNATURE_INFO = 'SET_SIGNATURE_INFO' as const;

export type SignatureInfoActionTypes = typeof SET_SIGNATURE_INFO;

// Temporary type definitions based on the what is needed for 
// the signature information.
export interface Identity {
  identity: {
    identityaddress: string;
    revocationauthority: string;
    recoveryauthority: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface BlockInfo {
  time: number;
  height: number;
  [key: string]: unknown;
}

// Action interfaces
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

// State interface
export interface SignatureInfoState {
  signedBy: Identity | null;
  sigBlockInfo: BlockInfo | null;
  signingRevocationIdentity: Identity | null;
  signingRecoveryIdentity: Identity | null;
}