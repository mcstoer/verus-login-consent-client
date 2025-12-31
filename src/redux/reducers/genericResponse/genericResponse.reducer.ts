/*
  This reducer contains the generic response being constructed,
  along with tracking which detail is currently being processed.
*/
import {
  COMPLETE_CURRENT_DETAIL,
  GenericResponseAction,
  GenericResponseState,
  SET_CURRENT_DETAIL_INDEX,
  SET_GENERIC_RESPONSE,
  UPDATE_CURRENT_DETAIL
} from './genericResponse.types';

const initialState: GenericResponseState = {
  response: null,
  currentDetailIndex: 0,
};

export const genericResponse = (
  state = initialState,
  action: GenericResponseAction
): GenericResponseState => {
  switch (action.type) {
  case SET_GENERIC_RESPONSE:
    return {
      ...state,
      response: action.payload.response,
    };
  case SET_CURRENT_DETAIL_INDEX:
    return {
      ...state,
      currentDetailIndex: action.payload.index,
    };
  case UPDATE_CURRENT_DETAIL:
    if (!state.response) {
      return state;
    }
    state.response.details[state.currentDetailIndex] = action.payload.detail;
    return {
      ...state,
      response: state.response,
    };
  case COMPLETE_CURRENT_DETAIL:
    if (!state.response) {
      return state;
    }
    state.response.details[state.currentDetailIndex] = action.payload.detail;
    return {
      ...state,
      response: state.response,
      currentDetailIndex: state.currentDetailIndex + 1,
    };
  default:
    return state;
  }
};
