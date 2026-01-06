import {GenericResponse, OrdinalVDXFObject} from 'verus-typescript-primitives';

export const SET_GENERIC_RESPONSE = 'SET_GENERIC_RESPONSE' as const;
export const SET_CURRENT_DETAIL_INDEX = 'SET_CURRENT_DETAIL_INDEX' as const;
export const UPDATE_CURRENT_DETAIL = 'UPDATE_CURRENT_DETAIL' as const;
export const COMPLETE_CURRENT_DETAIL = 'COMPLETE_CURRENT_DETAIL' as const;

export type GenericResponseActionTypes =
  | typeof SET_GENERIC_RESPONSE
  | typeof SET_CURRENT_DETAIL_INDEX
  | typeof UPDATE_CURRENT_DETAIL
  | typeof COMPLETE_CURRENT_DETAIL;

export interface SetGenericResponseAction {
  type: typeof SET_GENERIC_RESPONSE;
  payload: {
    response: GenericResponse;
  };
}

export interface SetCurrentDetailIndexAction {
  type: typeof SET_CURRENT_DETAIL_INDEX;
  payload: {
    index: number;
  };
}

export interface UpdateCurrentDetailAction {
  type: typeof UPDATE_CURRENT_DETAIL;
  payload: {
    detail: OrdinalVDXFObject;
  };
}

export interface CompleteCurrentDetailAction {
  type: typeof COMPLETE_CURRENT_DETAIL;
  payload: {
    detail: OrdinalVDXFObject;
  };
}

export type GenericResponseAction =
  | SetGenericResponseAction
  | SetCurrentDetailIndexAction
  | UpdateCurrentDetailAction
  | CompleteCurrentDetailAction;

// Ideally the GenericResponse would be serializable, but the initialization with empty details results
// a serialization error.
export interface GenericResponseState {
  response: GenericResponse | null;
  currentDetailIndex: number;
}
