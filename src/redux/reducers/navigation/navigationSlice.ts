import {
  generateDetailResponse,
  getStartPathForDetail,
  runDetailPrepFunction,
} from '#/features/details';
import {getDetailByIndex} from '#/features/details/detailNavigation';
import {setError} from '#/redux/reducers/error/error.actions';
import {
  removeResponseDetail,
  selectAllResponseDetails,
  upsertResponseDetail,
} from '#/redux/reducers/genericResponse/genericResponseSlice';
import {Identity} from '#/redux/reducers/signatureInfo/signatureInfo.types';
import {RootState} from '#/redux/store';
import {signGenericResponse} from '#/rpc/calls/signGenericResponse';
import BN from '#/utils/bn-polyfill';
import {
  CONSENT_TO_SCOPE,
  CREDENTIALS_REVIEW,
  IDENTITY_UPDATE_CONTENTMULTIMAP,
  IDENTITY_UPDATE_CORE,
  LOADING_DISPLAY,
  PROVISIONING_CONFIRM,
  PROVISIONING_FORM,
  PROVISIONING_RESULT,
  SELECT_LOGIN_ID,
} from '#/utils/constants';
import {AnyAction, createSlice, PayloadAction, ThunkAction} from '@reduxjs/toolkit';
import {
  CompactAddressObject,
  GENERIC_REQUEST_DEEPLINK_VDXF_KEY,
  GenericRequest,
  GenericResponse,
  OrdinalVDXFObject,
  VerifiableSignatureData,
} from 'verus-typescript-primitives';
import {completeRequest} from '../rpc/rpcSlice';
import {readNavigationPath} from './navigation.util';

export interface NavigationState {
  path: string;
  pathArray: string[];
  previousPath: string | undefined;
  externalAction: string;
  currentDetailIndex: number;
  navigationStack: string[];
}

const initialState: NavigationState = {
  path: LOADING_DISPLAY,
  pathArray: [LOADING_DISPLAY],
  previousPath: undefined,
  externalAction: '',
  currentDetailIndex: 0,
  navigationStack: [],
};

const navigationSlice = createSlice({
  name: 'navigation',
  initialState,
  reducers: {
    setNavigationPath: (
      state,
      action: PayloadAction<{navigationPath: string; navigationPathArray: string[]}>
    ) => {
      state.previousPath = state.path;
      state.path = action.payload.navigationPath;
      state.pathArray = action.payload.navigationPathArray;
    },
    setExternalAction: (state, action: PayloadAction<string>) => {
      state.externalAction = action.payload;
    },
    setCurrentDetailIndex: (state, action: PayloadAction<number>) => {
      state.currentDetailIndex = action.payload;
    },
    pushToNavigationStack: (state, action: PayloadAction<string>) => {
      state.navigationStack.push(action.payload);
    },
    popFromNavigationStack: state => {
      state.navigationStack = state.navigationStack.slice(0, -1);
    },
    clearNavigationStack: state => {
      state.navigationStack = [];
    },
  },
});

const DETAIL_COMPLETION_PATHS: Record<string, boolean> = {
  [PROVISIONING_RESULT]: true,
  [SELECT_LOGIN_ID]: true,
  [CREDENTIALS_REVIEW]: true,
  [IDENTITY_UPDATE_CONTENTMULTIMAP]: true,
};

const WITHIN_DETAIL_NEXT_PATHS: Record<string, string> = {
  [CONSENT_TO_SCOPE]: SELECT_LOGIN_ID,
  [IDENTITY_UPDATE_CORE]: IDENTITY_UPDATE_CONTENTMULTIMAP,
  // TODO: Update the provisioning path
  [PROVISIONING_FORM]: PROVISIONING_CONFIRM,
  [PROVISIONING_CONFIRM]: PROVISIONING_RESULT,
};

const getNextPathInDetail = (currentPath: string): string | null => {
  return WITHIN_DETAIL_NEXT_PATHS[currentPath] || null;
};

export const navigateGenericRequest =
  (): ThunkAction<Promise<void>, RootState, undefined, AnyAction> => async (dispatch, getState) => {
    const state = getState();
    const currentPath = state.navigation.path;
    const deeplinkId = state.deeplink.id;
    const genericRequest = state.deeplink.data as GenericRequest;
    const currentDetailIndex = state.navigation.currentDetailIndex || 0;
    const chainId = state.chainMetadata.chainId;

    try {
      if (deeplinkId !== GENERIC_REQUEST_DEEPLINK_VDXF_KEY.vdxfid) {
        throw new Error(
          `navigateGenericRequest can only be used with generic requests. ` +
            `Expected deeplink ID: ${GENERIC_REQUEST_DEEPLINK_VDXF_KEY.vdxfid}, ` +
            `but got: ${deeplinkId}`
        );
      }

      console.log('dispatching navigateGenericRequest from path:', currentPath);

      let nextPath: string;

      if (DETAIL_COMPLETION_PATHS[currentPath]) {
        const responseToAdd = generateDetailResponse(genericRequest, currentDetailIndex, getState);
        console.log(`Generated response from state for detail ${currentDetailIndex}`);

        if (responseToAdd) {
          const detailHexBuffer = responseToAdd.toBuffer().toString('hex');
          dispatch(
            upsertResponseDetail({
              index: currentDetailIndex,
              hexBuffer: detailHexBuffer,
            })
          );
        } else {
          // Remove the detail at the location if there is none to add.
          // This allows for previewing the next detail with previous completing it in cases without
          // linear navigation, like provisioning. If the user previews provisioning after completing
          // it, then navigating back out of the detail will not delete the completed provisioning.
          dispatch(removeResponseDetail(currentDetailIndex));
        }

        const newDetailIndex = currentDetailIndex + 1;
        const nextDetail = getDetailByIndex(genericRequest, newDetailIndex);

        if (nextDetail) {
          nextPath = getStartPathForDetail(nextDetail);

          await runDetailPrepFunction(nextDetail, newDetailIndex, dispatch, getState);
          dispatch(actions.setCurrentDetailIndex(newDetailIndex));
        } else {
          let signedResponse: GenericResponse | null = null;
          let error: Error | null = null;

          try {
            console.log('All details completed, signing and finalizing request');

            const finalState = getState();
            const responseDetails = selectAllResponseDetails(finalState);
            responseDetails.sort((a, b) => a.index - b.index);

            const ordinals = responseDetails.map(
              detail => OrdinalVDXFObject.createFromBuffer(Buffer.from(detail.hexBuffer, 'hex')).obj
            );

            const signingIdentity = state.identity.activeIdentity as Identity;
            const systemAddress = signingIdentity.identity.systemid;
            const identityAddress = signingIdentity.identity.identityaddress;

            const signature = new VerifiableSignatureData({
              systemID: CompactAddressObject.fromIAddress(systemAddress),
              identityID: CompactAddressObject.fromIAddress(identityAddress),
            });

            const response = new GenericResponse({
              requestID: genericRequest.requestID,
              requestHash: genericRequest.getRawDataSha256(),
              details: ordinals,
              signature,
              createdAt: new BN((Date.now() / 1000).toFixed(0)),
            });

            response.setSigned();

            console.log('Constructed complete GenericResponse:', response);

            signedResponse = await signGenericResponse(chainId, response);

            console.log('Generic request completed successfully');

            dispatch(
              completeRequest({
                type: 'v2',
                response: signedResponse,
                uris: genericRequest.responseURIs || [],
              })
            );
          } catch (e) {
            console.error('Error finalizing generic request:', e);
            error = e as Error;
            dispatch(setError(error));
          }

          return;
        }
      } else {
        const nextPathInDetail = getNextPathInDetail(currentPath);

        if (!nextPathInDetail) {
          console.warn(`No next path defined for: ${currentPath}`);
          throw new Error('No next path defined for current path');
        } else {
          nextPath = nextPathInDetail;
        }
      }

      dispatch(actions.pushToNavigationStack(currentPath));
      dispatch(
        actions.setNavigationPath({
          navigationPath: nextPath,
          navigationPathArray: readNavigationPath(nextPath),
        })
      );
      console.log('navigated to path:', nextPath);
    } catch (e) {
      dispatch(setError(e));
    }
  };

export const navigateBackGenericRequest =
  (): ThunkAction<void, RootState, undefined, AnyAction> => (dispatch, getState) => {
    const state = getState();
    const navigationStack = state.navigation.navigationStack || [];
    const currentDetailIndex = state.navigation.currentDetailIndex || 0;
    const deeplinkId = state.deeplink.id;

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

    const previousPathInCompletionPaths = DETAIL_COMPLETION_PATHS[previousPath];
    let newDetailIndex = currentDetailIndex;

    if (previousPathInCompletionPaths && currentDetailIndex > 0) {
      newDetailIndex = currentDetailIndex - 1;
    }

    dispatch(actions.popFromNavigationStack());
    dispatch(
      actions.setNavigationPath({
        navigationPath: previousPath,
        navigationPathArray: readNavigationPath(previousPath),
      })
    );

    if (newDetailIndex !== currentDetailIndex) {
      dispatch(actions.setCurrentDetailIndex(newDetailIndex));
    }

    console.log('navigated back to path:', previousPath);
  };

const actions = navigationSlice.actions;

export const setNavigationPath = (path: string) => {
  const navigationArray = readNavigationPath(path);

  return actions.setNavigationPath({
    navigationPath: path,
    navigationPathArray: navigationArray,
  });
};

export const setExternalAction = (externalAction: string) => {
  return actions.setExternalAction(externalAction);
};

export const setCurrentDetailIndex = (index: number) => {
  return actions.setCurrentDetailIndex(index);
};

export const pushToNavigationStack = (path: string) => {
  return actions.pushToNavigationStack(path);
};

export const popFromNavigationStack = () => {
  return actions.popFromNavigationStack();
};

export const clearNavigationStack = () => {
  return actions.clearNavigationStack();
};

export const navigation = navigationSlice.reducer;
