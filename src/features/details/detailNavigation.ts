import {AppDispatch, RootState} from '#/redux/store';
import {
  GenericRequest,
  OrdinalVDXFObject,
  VDXF_ORDINAL_AUTHENTICATION_REQUEST,
  VDXF_ORDINAL_IDENTITY_UPDATE_REQUEST,
  VDXF_ORDINAL_USER_DATA_REQUEST,
} from 'verus-typescript-primitives';
import {CONSENT_TO_SCOPE, CREDENTIALS_REVIEW, IDENTITY_UPDATE_CORE} from '#/utils/constants';
import {generateAuthenticationResponse, prepareAuthenticationDetail} from './authentication';
import {DetailPrepFunction, DetailResponseGenerator} from './types';
import {generateUserDataResponse, prepareUserDataDetail} from './userData';
import {generateIdentityUpdateResponse, prepareIdentityUpdateDetail} from './identityUpdate';

/**
 * Maps detail types to their initial navigation paths.
 * Each detail type should have an entry that specifies where to start the detail flow.
 */
const DETAIL_TYPE_TO_START_PATH: Record<string, string> = {
  [VDXF_ORDINAL_AUTHENTICATION_REQUEST.toNumber()]: CONSENT_TO_SCOPE,
  [VDXF_ORDINAL_USER_DATA_REQUEST.toNumber()]: CREDENTIALS_REVIEW,
  [VDXF_ORDINAL_IDENTITY_UPDATE_REQUEST.toNumber()]: IDENTITY_UPDATE_CORE,
};

/**
 * Maps detail types to their preparation functions.
 * These functions run before navigating to a detail's first screen.
 * Use them to initialize Redux state, fetch data, or perform validation.
 * They receive dispatch and getState to check current state and avoid redundant work.
 */
const DETAIL_TYPE_PREP_FUNCTIONS: Record<string, DetailPrepFunction> = {
  [VDXF_ORDINAL_AUTHENTICATION_REQUEST.toNumber()]: prepareAuthenticationDetail,
  [VDXF_ORDINAL_USER_DATA_REQUEST.toNumber()]: prepareUserDataDetail,
  [VDXF_ORDINAL_IDENTITY_UPDATE_REQUEST.toNumber()]: prepareIdentityUpdateDetail,
};

/**
 * Maps detail types to their response generator functions.
 * These functions are called when a detail completes to construct the response
 * from the current Redux state.
 */
const DETAIL_TYPE_RESPONSE_GENERATORS: Record<string, DetailResponseGenerator> = {
  [VDXF_ORDINAL_AUTHENTICATION_REQUEST.toNumber()]: generateAuthenticationResponse,
  [VDXF_ORDINAL_USER_DATA_REQUEST.toNumber()]: generateUserDataResponse,
  [VDXF_ORDINAL_IDENTITY_UPDATE_REQUEST.toNumber()]: generateIdentityUpdateResponse,
};

/**
 * Determines the starting navigation path for a given detail type.
 * Throws an error if the detail type is not recognized.
 */
export const getStartPathForDetail = (detail: OrdinalVDXFObject): string => {
  const detailType = detail.type;
  const startPath = DETAIL_TYPE_TO_START_PATH[detailType.toNumber()];

  if (!startPath) {
    throw new Error(
      `Unknown detail type: ${detailType}. No navigation path defined. ` +
        `Add an entry to DETAIL_TYPE_TO_START_PATH in detailNavigation.ts`
    );
  }

  return startPath;
};

/**
 * Runs the preparation function for a detail type, if one exists.
 * Prep functions are used to initialize state before navigating to a detail's screens.
 * The prep function receives getState so it can check if preparation has already been done.
 */
export const runDetailPrepFunction = async (
  detail: OrdinalVDXFObject,
  detailIndex: number,
  dispatch: AppDispatch,
  getState: () => RootState
): Promise<void> => {
  const detailType = detail.type;
  const prepFunction = DETAIL_TYPE_PREP_FUNCTIONS[detailType.toNumber()];

  if (prepFunction) {
    await prepFunction(detail, detailIndex, dispatch, getState);
  }
};

/**
 * Generates a response detail from the current Redux state.
 * Returns null if there should be no response detail.
 */
export const generateDetailResponse = (
  request: GenericRequest,
  detailIndex: number,
  getState: () => RootState
): OrdinalVDXFObject | null => {
  if (detailIndex >= request.details.length) {
    console.error(`Invalid detail index: ${detailIndex}`);
    return null;
  }

  const detail = request.details[detailIndex];
  const detailType = detail.type;
  const responseGenerator = DETAIL_TYPE_RESPONSE_GENERATORS[detailType.toNumber()];

  if (!responseGenerator) {
    console.log(`No response generator defined for detail type: ${detailType}`);
    return null;
  }

  return responseGenerator(request, detailIndex, getState);
};

/**
 * Validates that we can transition to the next detail.
 * Throws an error if:
 * - The current detail index is invalid
 * - We're trying to advance beyond the last detail
 */
export const validateDetailTransition = (
  currentDetailIndex: number,
  totalDetails: number
): void => {
  if (currentDetailIndex < 0) {
    throw new Error(`Invalid detail index: ${currentDetailIndex}. Index cannot be negative.`);
  }

  if (currentDetailIndex >= totalDetails) {
    throw new Error(
      `Invalid detail index: ${currentDetailIndex}. ` +
        `Request only has ${totalDetails} detail(s).`
    );
  }
};

/**
 * Safely gets a detail from the request based on the index.
 * Returns null if there are no more details.
 */
export const getDetailByIndex = (
  request: GenericRequest,
  currentDetailIndex: number
): OrdinalVDXFObject | null => {
  if (currentDetailIndex >= request.details.length) {
    return null;
  }

  return request.details[currentDetailIndex];
};

// Checks if based on the `currentDetailIndex` that we are at the last detail.
export const isLastDetail = (request: GenericRequest, currentDetailIndex: number): boolean => {
  if (!request || !request.details || request.details.length === 0) {
    return false;
  }

  return currentDetailIndex === request.details.length - 1;
};
