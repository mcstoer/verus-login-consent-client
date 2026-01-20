import {AnyAction, ThunkAction} from '@reduxjs/toolkit';
import {SET_EXTERNAL_ACTION, SET_NAVIGATION_PATH, SET_CURRENT_DETAIL_INDEX, PUSH_TO_NAVIGATION_STACK, POP_FROM_NAVIGATION_STACK, CLEAR_NAVIGATION_STACK} from './navigation.types';
import {readNavigationPath} from './navigation.util';
import {getNextDetail, getStartPathForDetail, runDetailPrepFunction} from '#/utils/detailNavigation';
import {GENERIC_REQUEST_DEEPLINK_VDXF_KEY, GenericRequest} from 'verus-typescript-primitives';
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
import {RootState} from '../../store';

/**
 * Sets the navigation path in the redux store.
 */
export const setNavigationPath = (path: string) => {
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
export const setExternalAction = (externalAction: string) => {
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
export const setCurrentDetailIndex = (index: number) => {
  return {
    type: SET_CURRENT_DETAIL_INDEX,
    payload: index
  };
};

/**
 * Pushes a path onto the navigation stack for backward navigation support
 */
export const pushToNavigationStack = (path: string) => {
  return {
    type: PUSH_TO_NAVIGATION_STACK,
    payload: {
      path
    }
  };
};

/**
 * Pops the most recent path from the navigation stack
 */
export const popFromNavigationStack = () => {
  return {
    type: POP_FROM_NAVIGATION_STACK
  };
};

/**
 * Clears the entire navigation stack
 */
export const clearNavigationStack = () => {
  return {
    type: CLEAR_NAVIGATION_STACK
  };
};

/**
 * Paths that mark the completion of a detail's flow.
 * When navigation reaches one of these paths, the detail is considered complete
 * and the system should transition to the next detail or finalization.
 */
const DETAIL_COMPLETION_PATHS: Record<string, boolean> = {
  [IDENTITY_UPDATE_RESULT]: true,
  [PROVISIONING_RESULT]: true,
  // Add other detail type completion paths as they are implemented
};

/**
 * Maps paths to their next paths within the same detail flow.
 * This handles navigation within a detail, not between details.
 */
const WITHIN_DETAIL_NEXT_PATHS: Record<string, string> = {
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

// Determines the next path within the current detail flow.
const getNextPathInDetail = (currentPath: string): string | null => {
  return WITHIN_DETAIL_NEXT_PATHS[currentPath] || null;
};

export const navigateGenericRequest = (): ThunkAction<Promise<void>, RootState, undefined, AnyAction> => async (dispatch, getState) => {
  const state = getState();
  const currentPath = state.navigation.path;
  const deeplinkId = state.deeplink.id;
  const deeplinkData = state.deeplink.data as GenericRequest;
  const currentDetailIndex = state.navigation.currentDetailIndex || 0;

  // Validate that the deeplink is a generic request
  if (deeplinkId !== GENERIC_REQUEST_DEEPLINK_VDXF_KEY.vdxfid) {
    throw new Error(
      `navigateGenericRequest can only be used with generic requests. ` +
      `Expected deeplink ID: ${GENERIC_REQUEST_DEEPLINK_VDXF_KEY.vdxfid}, ` +
      `but got: ${deeplinkId}`
    );
  }

  console.log("dispatching navigateGenericRequest from path:", currentPath);

  let nextPath: string;
  let newDetailIndex = currentDetailIndex;

  // Check if current path marks detail completion
  if (DETAIL_COMPLETION_PATHS[currentPath]) {
    // Detail is complete, move to next detail or finalization
    const nextDetail = getNextDetail(deeplinkData, currentDetailIndex);

    if (nextDetail) {
      // More details to process - navigate to the start of the next detail
      nextPath = getStartPathForDetail(nextDetail);
      newDetailIndex = currentDetailIndex + 1;

      // Run the prep function for the next detail
      // The prep function should check state to avoid redundant work
      await runDetailPrepFunction(nextDetail, dispatch, getState);
    } else {
      // All details complete - navigate to finalization
      nextPath = GENERIC_FINALIZATION;
    }
  } else {
    // Navigate within current detail
    const nextPathInDetail = getNextPathInDetail(currentPath);

    if (!nextPathInDetail) {
      // No next path defined for current path - this might be an error
      console.warn(`No next path defined for: ${currentPath}`);
      nextPath = GENERIC_FINALIZATION; // Fallback to finalization
    } else {
      nextPath = nextPathInDetail;
    }
  }

  // Push current path to stack before navigating forward
  dispatch(pushToNavigationStack(currentPath));
  dispatch(setNavigationPath(nextPath));

  // If detail index changed, dispatch action to update it
  if (newDetailIndex !== currentDetailIndex) {
    dispatch(setCurrentDetailIndex(newDetailIndex));
  }
  console.log("navigated to path:", nextPath);
};

/**
 * Navigates backward in the generic request flow.
 * Returns to the previous path in the navigation stack.
 */
export const navigateBackGenericRequest = (): ThunkAction<void, RootState, undefined, AnyAction> => (dispatch, getState) => {
  const state = getState();
  const navigationStack = state.navigation.navigationStack || [];
  const currentDetailIndex = state.navigation.currentDetailIndex || 0;
  const deeplinkId = state.deeplink.id;

  // Validate that the deeplink is a generic request
  if (deeplinkId !== GENERIC_REQUEST_DEEPLINK_VDXF_KEY.vdxfid) {
    throw new Error(
      `navigateBackGenericRequest can only be used with generic requests. ` +
      `Expected deeplink ID: ${GENERIC_REQUEST_DEEPLINK_VDXF_KEY.vdxfid}, ` +
      `but got: ${deeplinkId}`
    );
  }

  if (navigationStack.length === 0) {
    console.warn('Cannot navigate back: navigation stack is empty');
    return;
  }

  const previousPath = navigationStack[navigationStack.length - 1];
  console.log('navigating back from', state.navigation.path, 'to', previousPath);

  // Check if we are returning to a previous detail
  const previousPathInCompletionPaths = DETAIL_COMPLETION_PATHS[previousPath];
  let newDetailIndex = currentDetailIndex;

  if (previousPathInCompletionPaths && currentDetailIndex > 0) {
    newDetailIndex = currentDetailIndex - 1;
  }

  dispatch(popFromNavigationStack());
  dispatch(setNavigationPath(previousPath));

  if (newDetailIndex !== currentDetailIndex) {
    dispatch(setCurrentDetailIndex(newDetailIndex));
  }

  console.log('navigated back to path:', previousPath);
};
