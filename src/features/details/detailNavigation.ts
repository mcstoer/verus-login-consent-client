import {AppDispatch, RootState} from '#/redux/store';
import {
  GenericRequest,
  OrdinalVDXFObject,
  VDXF_ORDINAL_APP_ENCRYPTION_REQUEST,
  VDXF_ORDINAL_AUTHENTICATION_REQUEST,
  VDXF_ORDINAL_IDENTITY_UPDATE_REQUEST,
  VDXF_ORDINAL_PROVISION_IDENTITY_DETAILS,
  VDXF_ORDINAL_USER_DATA_REQUEST,
} from 'verus-typescript-primitives';
import {
  CREDENTIALS_REVIEW,
  IDENTITY_UPDATE_CONTENTMULTIMAP,
  IDENTITY_UPDATE_CORE,
  PROVISIONING_CONFIRM,
  PROVISIONING_FORM,
  PROVISIONING_RESULT,
  SELECT_LOGIN_ID,
} from '#/utils/constants';
import {generateAuthenticationResponse, prepareAuthenticationDetail} from './authentication';
import {DetailMapEntry, DetailPrepFunction, DetailResponse, DetailResponseGenerator} from './types';
import {generateUserDataResponse, prepareUserDataDetail} from './userData';
import {generateIdentityUpdateResponse, prepareIdentityUpdateDetail} from './identityUpdate';
import {generateAppEncryptionResponse, prepareAppEncryptionDetail} from './appEncryption';

const noOpPrepFunction: DetailPrepFunction = async () => {};

const noOpResponseGenerator: DetailResponseGenerator = async () => null;

/**
 * Central map of detail types to their navigation configuration.
 *
 * Each entry defines:
 * - `type`: How the detail participates in the navigation flow
 *   - `standard` – has one or more UI screens
 *   - `headless` – no UI; prep + response run automatically
 *   - `detour` – has UI but interrupts the normal flow (e.g. provisioning)
 * - `prepFunction`: Runs before the first screen is shown (or before response generation for headless)
 * - `screens`: Ordered array of screen path constants the user navigates through
 * - `responseGenerator`: Produces the response detail once the user completes all screens
 */
const DETAIL_MAP: Record<string, DetailMapEntry> = {
  [VDXF_ORDINAL_AUTHENTICATION_REQUEST.toNumber()]: {
    type: 'standard',
    prepFunction: prepareAuthenticationDetail,
    screens: [SELECT_LOGIN_ID],
    responseGenerator: generateAuthenticationResponse,
  },
  [VDXF_ORDINAL_USER_DATA_REQUEST.toNumber()]: {
    type: 'standard',
    prepFunction: prepareUserDataDetail,
    screens: [CREDENTIALS_REVIEW],
    responseGenerator: generateUserDataResponse,
  },
  [VDXF_ORDINAL_IDENTITY_UPDATE_REQUEST.toNumber()]: {
    type: 'standard',
    prepFunction: prepareIdentityUpdateDetail,
    screens: [IDENTITY_UPDATE_CORE, IDENTITY_UPDATE_CONTENTMULTIMAP],
    responseGenerator: generateIdentityUpdateResponse,
  },
  [VDXF_ORDINAL_APP_ENCRYPTION_REQUEST.toNumber()]: {
    type: 'headless',
    prepFunction: prepareAppEncryptionDetail,
    screens: [],
    responseGenerator: generateAppEncryptionResponse,
  },
  [VDXF_ORDINAL_PROVISION_IDENTITY_DETAILS.toNumber()]: {
    type: 'detour',
    prepFunction: noOpPrepFunction,
    screens: [PROVISIONING_FORM, PROVISIONING_CONFIRM, PROVISIONING_RESULT],
    responseGenerator: noOpResponseGenerator,
  },
};

/**
 * Finds the detail map entry for a given ordinal.
 * Throws if the detail type is not registered in the map.
 */
export const getDetailMapEntry = (detail: OrdinalVDXFObject): DetailMapEntry => {
  const key = detail.type.toNumber();
  const entry = DETAIL_MAP[key];

  if (!entry) {
    throw new Error(`Unknown detail type: ${detail.type}. No entry in DETAIL_MAP.`);
  }

  return entry;
};

/**
 * Safely gets a detail from the request based on the index.
 * Returns null if the index is out of bounds.
 */
export const getDetailByIndex = (
  request: GenericRequest,
  currentDetailIndex: number
): OrdinalVDXFObject | null => {
  if (currentDetailIndex < 0 || currentDetailIndex >= request.details.length) {
    return null;
  }

  return request.details[currentDetailIndex];
};

/**
 * Determines the starting navigation path for a given detail.
 * Returns the first screen from the detail map, or null for headless details.
 */
export const getStartPathForDetail = (detail: OrdinalVDXFObject): string | null => {
  const entry = getDetailMapEntry(detail);
  return entry.screens.length > 0 ? entry.screens[0] : null;
};

/**
 * Runs the preparation function for a detail, if one exists.
 */
export const runDetailPrepFunction = async (
  detail: OrdinalVDXFObject,
  detailIndex: number,
  dispatch: AppDispatch,
  getState: () => RootState
): Promise<void> => {
  const entry = getDetailMapEntry(detail);
  await entry.prepFunction(detail, detailIndex, dispatch, getState);
};

/**
 * Generates a response detail from the current Redux state using the detail map.
 * Returns null if there should be no response detail.
 */
export async function generateDetailResponse(
  request: GenericRequest,
  detailIndex: number,
  getState: () => RootState
): Promise<DetailResponse> {
  const detail = getDetailByIndex(request, detailIndex);

  if (!detail) {
    console.error(`Invalid detail index: ${detailIndex}`);
    return null;
  }

  const entry = getDetailMapEntry(detail);
  return entry.responseGenerator(request, detailIndex, getState);
}

/** Validates that a detail index is within bounds. */
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

export const isLastDetail = (request: GenericRequest, currentDetailIndex: number): boolean => {
  if (!request || !request.details || request.details.length === 0) {
    return false;
  }

  return currentDetailIndex === request.details.length - 1;
};
