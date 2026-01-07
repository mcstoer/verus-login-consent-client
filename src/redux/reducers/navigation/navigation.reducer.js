/*
  This reducer contains user navigation data to
  track where in the app navigation space the user
  is currently.
*/

import {LOADING_DISPLAY} from '../../../utils/constants';
import {SET_EXTERNAL_ACTION, SET_NAVIGATION_PATH, SET_CURRENT_DETAIL_INDEX} from './navigation.types';

export const navigation = (state = {
  path: LOADING_DISPLAY,
  pathArray: [LOADING_DISPLAY],
  previousPath: undefined,
  externalAction: "",
  currentDetailIndex: 0
}, action) => {
  switch (action.type) {
  case SET_NAVIGATION_PATH:
    return {
      ...state,
      previousPath: state.path,
      path: action.payload.navigationPath,
      pathArray: action.payload.navigationPathArray
    };
  case SET_EXTERNAL_ACTION:
    return {
      ...state,
      externalAction: action.payload.externalAction
    };
  case SET_CURRENT_DETAIL_INDEX:
    return {
      ...state,
      currentDetailIndex: action.payload.currentDetailIndex
    };
  default:
    return state;
  }
};