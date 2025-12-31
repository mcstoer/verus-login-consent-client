import {GenericResponse, OrdinalVDXFObject} from 'verus-typescript-primitives';
import {
  COMPLETE_CURRENT_DETAIL,
  CompleteCurrentDetailAction,
  SET_CURRENT_DETAIL_INDEX,
  SET_GENERIC_RESPONSE,
  SetCurrentDetailIndexAction,
  SetGenericResponseAction,
  UPDATE_CURRENT_DETAIL,
  UpdateCurrentDetailAction
} from './genericResponse.types';

export const setGenericResponse = (
  response: GenericResponse
): SetGenericResponseAction => {
  return {
    type: SET_GENERIC_RESPONSE,
    payload: {
      response,
    },
  };
};

export const setCurrentDetailIndex = (
  index: number
): SetCurrentDetailIndexAction => {
  return {
    type: SET_CURRENT_DETAIL_INDEX,
    payload: {
      index,
    },
  };
};

export const updateCurrentDetail = (
  detail: OrdinalVDXFObject
): UpdateCurrentDetailAction => {
  return {
    type: UPDATE_CURRENT_DETAIL,
    payload: {
      detail,
    },
  };
};

export const completeCurrentDetail = (
  detail: OrdinalVDXFObject
): CompleteCurrentDetailAction => {
  return {
    type: COMPLETE_CURRENT_DETAIL,
    payload: {
      detail,
    },
  };
};
