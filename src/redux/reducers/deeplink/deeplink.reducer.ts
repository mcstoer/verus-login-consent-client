/*
  This reducer contains the deeplink information, including the
  type of deeplink (id) and the data associated with it.
*/
import {DeeplinkAction, DeeplinkData, DeeplinkState, SET_DEEPLINK_DATA} from './deeplink.types';

const initialState: DeeplinkState = {
  id: '',
  data: undefined,
};

export const deeplink = (state = initialState, action: DeeplinkAction): DeeplinkState => {
  switch (action.type) {
  case SET_DEEPLINK_DATA:
    return {
      ...state,
      id: action.payload.id,
      data: action.payload.data as DeeplinkData,
    };
  default:
    return state;
  }
};