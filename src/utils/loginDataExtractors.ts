import {
  GenericRequest,
  LoginConsentRequest,
  ID_ADDRESS_VDXF_KEY,
  LOGIN_CONSENT_ID_PROVISIONING_WEBHOOK_VDXF_KEY,
  VDXF_ORDINAL_AUTHENTICATION_REQUEST,
} from 'verus-typescript-primitives';
import {SUPPORTED_CREDENTIALS} from './constants';
import {Identity} from '../redux/reducers/signatureInfo/signatureInfo.types';

// The data for displaying the identity selection UI for login.
export interface LoginData {
  requestedDataKeys: string[];
  hasRequestedCredentials: boolean;
  canProvision: boolean;
  identitySubjects: string[];
}

// extractLoginDataV1 gets the data from the LoginConsentRequest.
export const extractLoginDataV1 = (
  request: LoginConsentRequest,
  identities: Identity[],
): LoginData => {
  const requestedDataKeys: string[] = (request.challenge.requested_access || [])
    .filter((item: {vdxfkey: string}) => SUPPORTED_CREDENTIALS.includes(item.vdxfkey))
    .map((item: {vdxfkey: string}) => item.vdxfkey);

  const hasRequestedCredentials: boolean = requestedDataKeys.length > 0;

  let canProvision: boolean = !!request.challenge.provisioning_info && request.challenge.provisioning_info.some((x: {vdxfkey: string}) => {
    return (
      x.vdxfkey === LOGIN_CONSENT_ID_PROVISIONING_WEBHOOK_VDXF_KEY.vdxfid
    );
  });

  const identitySubjects: string[] =
    (request.challenge.subject || [])
      .filter((item: {vdxfkey: string}) => item.vdxfkey === ID_ADDRESS_VDXF_KEY.vdxfid)
      .map((id: {data: string}) => id.data);

  if (identities.length > 0 && identitySubjects.length > 0) {
    const identitySubjectMatches = identities.filter((id: Identity) =>
      identitySubjects.includes(id.identity.identityaddress)
    );

    if (identitySubjectMatches.length > 0) {
      canProvision = false;
    }
  }

  return {
    requestedDataKeys,
    hasRequestedCredentials,
    canProvision,
    identitySubjects,
  };
};

// extractLoginDataV2 gets the data from the authentication request detail in a generic request.
export const extractLoginDataV2 = (
  request: GenericRequest,
  identities: Identity[],
  currentDetailIndex: number,
): LoginData => {
  const authDetail = request.details[currentDetailIndex];

  if (!authDetail.type.eq(VDXF_ORDINAL_AUTHENTICATION_REQUEST)) {
    throw new Error('Current detail in the request is not an authentication request detail');
  }

  const requestedDataKeys: string[] = [];
  const hasRequestedCredentials: boolean = false;

  // TODO: Implement provisioning detection for v2 when provisioning detail type is defined
  const canProvision = false;

  // TODO: Extract identity subjects from auth detail when structure is defined
  const identitySubjects: string[] = [];

  return {
    requestedDataKeys,
    hasRequestedCredentials,
    canProvision,
    identitySubjects,
  };
};
