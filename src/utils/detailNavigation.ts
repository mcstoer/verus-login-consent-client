import {AppDispatch, RootState} from '#/redux/store';
import {
  AuthenticationRequestOrdinalVDXFObject,
  AuthenticationResponseDetails,
  AuthenticationResponseOrdinalVDXFObject,
  GenericRequest,
  OrdinalVDXFObject,
  VDXF_ORDINAL_AUTHENTICATION_REQUEST,
} from 'verus-typescript-primitives';
import {CONSENT_TO_SCOPE} from './constants';

/**
 * Maps detail types to their initial navigation paths.
 * Each detail type should have an entry that specifies where to start the detail flow.
 */
const DETAIL_TYPE_TO_START_PATH: Record<string, string> = {
  [VDXF_ORDINAL_AUTHENTICATION_REQUEST.toNumber()]: CONSENT_TO_SCOPE,
};

/**
 * Maps detail types to their preparation functions.
 * These functions run before navigating to a detail's first screen.
 * Use them to initialize Redux state, fetch data, or perform validation.
 * They receive dispatch and getState to check current state and avoid redundant work.
 */
type DetailPrepFunction = (
  detail: OrdinalVDXFObject,
  dispatch: AppDispatch,
  getState: () => RootState
) => Promise<void>;

const DETAIL_TYPE_PREP_FUNCTIONS: Record<string, DetailPrepFunction> = {
  // Add prep functions as detail types are implemented
  // Example:
  [VDXF_ORDINAL_AUTHENTICATION_REQUEST.toNumber()]: async () => {
    // No prep needed for authentication request at this time
    // Possibly handle the recipientConstraints here in the future
    // When implementing a real prep function, you'll have access to:
    // - detail: the OrdinalVDXFObject to prepare
    // - dispatch: to dispatch Redux actions
    // - getState: to check current state and avoid redundant work
    console.log('No prep function needed for authentication request detail');
    return;
  },

  // Example of a prep function that checks state to avoid redundant work:
  // [SOME_DETAIL_TYPE]: async (detail, dispatch, getState) => {
  //   const state = getState();
  //
  //   // Check if this detail has already been prepped
  //   const alreadyPrepped = state.someSlice.preppedDetails?.[detail.id];
  //   if (alreadyPrepped) {
  //     console.log('Detail already prepared, skipping prep');
  //     return;
  //   }
  //
  //   // Perform preparation work
  //   const prepData = await fetchSomeData(detail);
  //   dispatch(setSomeData(prepData));
  //   dispatch(markDetailAsPrepped(detail.id));
  // }
};

/**
 * Maps detail types to their response generator functions.
 * These functions are called when a detail completes to construct the response
 * from the current Redux state.
 */
type DetailResponseGenerator = (
  request: GenericRequest,
  detailIndex: number,
  getState: () => RootState
) => OrdinalVDXFObject | null;

const DETAIL_TYPE_RESPONSE_GENERATORS: Record<string, DetailResponseGenerator> = {
  [VDXF_ORDINAL_AUTHENTICATION_REQUEST.toNumber()]: (request, detailIndex, getState) => {
    const state = getState();
    const ordinalWrapper = request.details[detailIndex];

    if (!(ordinalWrapper instanceof AuthenticationRequestOrdinalVDXFObject)) {
      throw new Error('Detail is not an AuthenticationRequestOrdinalVDXFObject');
    }

    const authRequestDetail = ordinalWrapper.data;

    console.log('Generating authentication response from state:', {
      activeIdentity: state.identity.activeIdentity,
      detailIndex,
    });

    const authResponseDetail = new AuthenticationResponseOrdinalVDXFObject({
      data: new AuthenticationResponseDetails({
        requestID: authRequestDetail.requestID,
      }),
    });

    return authResponseDetail;
  },

  // Example of a more complete response generator:
  // [SOME_DETAIL_TYPE]: (request, detailIndex, getState) => {
  //   const state = getState();
  //   const detail = request.details[detailIndex];
  //   const responseData = state.someSlice.responseData;
  //
  //   if (!responseData) {
  //     console.warn('No response data available for detail');
  //     return null;
  //   }
  //
  //   return new SomeResponseOrdinalVDXFObject({
  //     ...responseData,
  //     // Additional response fields
  //   });
  // }
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
  dispatch: AppDispatch,
  getState: () => RootState
): Promise<void> => {
  const detailType = detail.type;
  const prepFunction = DETAIL_TYPE_PREP_FUNCTIONS[detailType.toNumber()];

  if (prepFunction) {
    await prepFunction(detail, dispatch, getState);
  }
};

/**
 * Generates a response detail from the current Redux state.
 * Returns null if the detail type doesn't have a response generator or
 * if the current state doesn't allow generating a response.
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
 * Gets the next detail from the request, validating the index.
 * Returns null if there are no more details.
 */
export const getNextDetail = (
  request: GenericRequest,
  currentDetailIndex: number
): OrdinalVDXFObject | null => {
  const nextDetailIndex = currentDetailIndex + 1;

  if (nextDetailIndex >= request.details.length) {
    return null;
  }

  return request.details[nextDetailIndex];
};

// Checks if based on the `currentDetailIndex` that we are at the last detail.
export const isLastDetail = (request: GenericRequest, currentDetailIndex: number): boolean => {
  if (!request || !request.details || request.details.length === 0) {
    return false;
  }

  return currentDetailIndex === request.details.length - 1;
};
