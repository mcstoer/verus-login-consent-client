import { SET_DEEPLINK_DATA, DeeplinkState, DeeplinkAction, DeeplinkData } from "./deeplink.types";

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