import {GenericRequest, OrdinalVDXFObject, VDXF_ORDINAL_AUTHENTICATION_REQUEST} from 'verus-typescript-primitives';
import {Dispatch} from 'redux';
import {CONSENT_TO_SCOPE, GENERIC_FINALIZATION} from './constants';

/**
 * Maps detail types to their initial navigation paths.
 * Each detail type should have an entry that specifies where to start the detail flow.
 */
const DETAIL_TYPE_TO_START_PATH: Record<string, string> = {
  [VDXF_ORDINAL_AUTHENTICATION_REQUEST]: CONSENT_TO_SCOPE
};

/**
 * Maps detail types to their preparation functions.
 * These functions run before navigating to a detail's first screen.
 * Use them to initialize Redux state, fetch data, or perform validation.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DetailPrepFunction = (detail: OrdinalVDXFObject, dispatch: Dispatch<any>) => Promise<void>;

const DETAIL_TYPE_PREP_FUNCTIONS: Record<string, DetailPrepFunction> = {
  // Add prep functions as detail types are implemented
  // Example:
  [VDXF_ORDINAL_AUTHENTICATION_REQUEST.vdxfid]: async () => {
    // No prep needed for authentication request at this time
    // Possibly handle the recipientConstraints here in the future
    return;
  }
};

/**
 * Determines the starting navigation path for a given detail type.
 * Throws an error if the detail type is not recognized.
 */
export const getStartPathForDetail = (detail: OrdinalVDXFObject): string => {
  const detailType = detail.type;
  const startPath = DETAIL_TYPE_TO_START_PATH[detailType];

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
 */
export const runDetailPrepFunction = async (
  detail: OrdinalVDXFObject,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dispatch: Dispatch<any>
): Promise<void> => {
  const detailType = detail.type;
  const prepFunction = DETAIL_TYPE_PREP_FUNCTIONS[detailType];

  if (prepFunction) {
    await prepFunction(detail, dispatch);
  }
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
    return null; // All details complete
  }

  return request.details[nextDetailIndex];
};

/**
 * Determines the next navigation path after a detail completes.
 * Returns the path to navigate to after calling completeCurrentDetail().
 *
 * This function should be called by components to determine where to navigate
 * after completing a detail.
 *
 * @param request - The GenericRequest being processed
 * @param currentDetailIndex - The index of the detail that just completed
 * @returns The navigation path to dispatch
 */
export const getNextNavigationPath = (
  request: GenericRequest,
  currentDetailIndex: number
): string => {
  const nextDetail = getNextDetail(request, currentDetailIndex);

  if (nextDetail) {
    // More details to process - navigate to the start of the next detail
    const nextPath = getStartPathForDetail(nextDetail);
    console.log(`Detail ${currentDetailIndex} complete. Advancing to detail ${currentDetailIndex + 1}: ${nextPath}`);
    return nextPath;
  } else {
    // All details complete - navigate to finalization
    console.log(`All ${request.details.length} detail(s) complete. Navigating to finalization.`);
    return GENERIC_FINALIZATION;
  }
};
