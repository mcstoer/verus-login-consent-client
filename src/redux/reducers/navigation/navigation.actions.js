import {SET_EXTERNAL_ACTION, SET_NAVIGATION_PATH, SET_CURRENT_DETAIL_INDEX} from './navigation.types';
import {readNavigationPath} from './navigation.util';
import {getNextDetail, getStartPathForDetail} from '../../../utils/detailNavigation';
import {GENERIC_REQUEST_DEEPLINK_VDXF_KEY} from 'verus-typescript-primitives';
import {
  IDENTITY_UPDATE_RESULT,
  PROVISIONING_RESULT,
  GENERIC_FINALIZATION,
  IDENTITY_UPDATE_CONFIRM,
  IDENTITY_UPDATE_CORE,
  IDENTITY_UPDATE_CONTENTMULTIMAP,
  PROVISIONING_FORM,
  PROVISIONING_CONFIRM,
  CONSENT_TO_SCOPE,
  SELECT_LOGIN_ID
} from '../../../utils/constants';

/**
 * Sets the navigation path in the redux store.
 */
export const setNavigationPath = (path) => {
  const navigationArray = readNavigationPath(path);

  return {
    type: SET_NAVIGATION_PATH,
    payload: {
      navigationPath: path,
      navigationPathArray: navigationArray
    }
  };
};

/**
 * Sets the navigation path in the redux store
 */
export const setExternalAction = (externalAction) => {
  return {
    type: SET_EXTERNAL_ACTION,
    payload: {
      externalAction
    }
  };
};

/**
 * Sets the current detail index for multi-detail generic requests
 */
export const setCurrentDetailIndex = (index) => {
  return {
    type: SET_CURRENT_DETAIL_INDEX,
    payload: {
      currentDetailIndex: index
    }
  };
};

/**
 * Paths that mark the completion of a detail's flow.
 * When navigation reaches one of these paths, the detail is considered complete
 * and the system should transition to the next detail or finalization.
 */
const DETAIL_COMPLETION_PATHS = {
  [IDENTITY_UPDATE_RESULT]: true,
  [PROVISIONING_RESULT]: true,
  // Add other detail type completion paths as they are implemented
};

/**
 * Maps paths to their next paths within the same detail flow.
 * This handles navigation within a detail, not between details.
 */
const WITHIN_DETAIL_NEXT_PATHS = {
  // Identity Update flow
  [IDENTITY_UPDATE_CONFIRM]: IDENTITY_UPDATE_CORE,
  [IDENTITY_UPDATE_CORE]: IDENTITY_UPDATE_CONTENTMULTIMAP,
  [IDENTITY_UPDATE_CONTENTMULTIMAP]: IDENTITY_UPDATE_RESULT,

  // Provisioning flow
  [PROVISIONING_FORM]: PROVISIONING_CONFIRM,
  [PROVISIONING_CONFIRM]: PROVISIONING_RESULT,

  // Login Consent flow
  [CONSENT_TO_SCOPE]: SELECT_LOGIN_ID,
  // Add more within-detail path mappings as needed
};

/**
 * Determines the next path within the current detail flow.
 * @param {string} currentPath - The current navigation path
 * @returns {string|null} The next path within the detail, or null if at end of detail
 */
const getNextPathInDetail = (currentPath) => {
  return WITHIN_DETAIL_NEXT_PATHS[currentPath] || null;
};

/**
 * Thunk that determines the next navigation path within the generic request handling flow
 * based on the current state. This handles navigation both between details and within a detail itself.
 * Reads currentPath, deeplinkId, deeplinkData, and currentDetailIndex from the Redux store.
 * @returns {Function} Thunk function that dispatches navigation action
 */
export const navigateGenericRequest = () => (dispatch, getState) => {
  const state = getState();
  const currentPath = state.navigation.path;
  const deeplinkId = state.deeplink.id;
  const deeplinkData = state.deeplink.data;
  const currentDetailIndex = state.navigation.currentDetailIndex || 0;

  // Validate that the deeplink is a generic request
  if (deeplinkId !== GENERIC_REQUEST_DEEPLINK_VDXF_KEY.vdxfid) {
    throw new Error(
      `navigateGenericRequest can only be used with generic requests. ` +
      `Expected deeplink ID: ${GENERIC_REQUEST_DEEPLINK_VDXF_KEY.vdxfid}, ` +
      `but got: ${deeplinkId}`
    );
  }

  let nextPath;
  let newDetailIndex = currentDetailIndex;

  // Check if current path marks detail completion
  if (DETAIL_COMPLETION_PATHS[currentPath]) {
    // Detail is complete, move to next detail or finalization
    const nextDetail = getNextDetail(deeplinkData, currentDetailIndex);

    if (nextDetail) {
      // More details to process - navigate to the start of the next detail
      nextPath = getStartPathForDetail(nextDetail);
      newDetailIndex = currentDetailIndex + 1;
    } else {
      // All details complete - navigate to finalization
      nextPath = GENERIC_FINALIZATION;
    }
  } else {
    // Navigate within current detail
    nextPath = getNextPathInDetail(currentPath);

    if (!nextPath) {
      // No next path defined for current path - this might be an error
      console.warn(`No next path defined for: ${currentPath}`);
      nextPath = GENERIC_FINALIZATION; // Fallback to finalization
    }
  }

  dispatch(setNavigationPath(nextPath));

  // If detail index changed, dispatch action to update it
  if (newDetailIndex !== currentDetailIndex) {
    dispatch(setCurrentDetailIndex(newDetailIndex));
  }
};