import { DeeplinkData } from "./deeplink.types";
import {
  SET_DEEPLINK_DATA,
  SetDeeplinkDataAction
} from "./deeplink.types";

export const setDeeplinkData = (id: string, data: DeeplinkData): SetDeeplinkDataAction => {
  return {
    type: SET_DEEPLINK_DATA,
    payload: {
      id,
      data,
    },
  };
};