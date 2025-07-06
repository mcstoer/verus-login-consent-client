import { 
  LoginConsentRequest, 
  IdentityUpdateRequest, 
  VerusPayInvoice 
} from "verus-typescript-primitives";

export const SET_DEEPLINK_DATA = 'SET_DEEPLINK_DATA' as const;

export type DeeplinkActionTypes = typeof SET_DEEPLINK_DATA;

// Action interfaces
export interface SetDeeplinkDataAction {
  type: typeof SET_DEEPLINK_DATA;
  payload: {
    id: string;
    data: DeeplinkData;
  };
}

export type DeeplinkAction = SetDeeplinkDataAction;

// State interface
export type DeeplinkData =
  | LoginConsentRequest
  | IdentityUpdateRequest
  | VerusPayInvoice;

export interface DeeplinkState {
  id: string;
  data: DeeplinkData;
}