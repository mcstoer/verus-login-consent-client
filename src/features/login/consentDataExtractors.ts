import {
  AuthenticationRequestDetails,
  AuthenticationRequestOrdinalVDXFObject,
  GenericRequest,
  IdentityUpdateRequestOrdinalVDXFObject,
  LoginConsentRequest,
  RecipientConstraint,
  RedirectUri,
  ResponseURI,
} from 'verus-typescript-primitives';
import {CREDENTIALS, SCOPES, SUPPORTED_CREDENTIALS} from '#/utils/constants';
import {convertFqnToDisplayFormat} from '#/utils/fullyqualifiedname';
import {Identity} from '#/redux/reducers/signatureInfo/signatureInfo.types';
import {unixToDate} from '#/utils/math';
import {getSystemNameFromSystemId} from '#/utils/systems';

export interface ConsentData {
  title: string;
  signerFqn: string;
  permissionsLabels: string[];
  systemId: string;
  expiryLabel?: string;
  constraintsLabels?: string[];
  responseURIsLabels?: string[];
}

// extractConsentDataV1 extracts display data from a LoginConsentRequest for the consent screen.
export const extractConsentDataV1 = (
  request: LoginConsentRequest,
  signedBy: Identity
): ConsentData => {
  const signerFqn = convertFqnToDisplayFormat(signedBy.fullyqualifiedname);
  const systemId = request.system_id;

  const requestedPermissions = request.challenge.requested_access;
  const permissionsDescriptions: string[] = [];

  if (requestedPermissions != null) {
    for (const permission of requestedPermissions) {
      if (SCOPES[permission.vdxfkey]) {
        permissionsDescriptions.push(SCOPES[permission.vdxfkey].description);
      } else if (
        SUPPORTED_CREDENTIALS.includes(permission.vdxfkey) &&
        CREDENTIALS[permission.vdxfkey]
      ) {
        permissionsDescriptions.push(
          'Get ' + CREDENTIALS[permission.vdxfkey].description + ' credential'
        );
      }
    }
  }

  const responseURIsLabels = request.challenge.redirect_uris.map((uri: RedirectUri) => uri.uri);

  return {
    title: `${signerFqn} is requesting login with VerusID`,
    signerFqn,
    permissionsLabels: permissionsDescriptions,
    systemId,
    responseURIsLabels,
  };
};

const getExpiryLabel = (authReqDetail: AuthenticationRequestDetails) => {
  if (!authReqDetail?.hasExpiryTime()) return null;
  return unixToDate(authReqDetail.expiryTime.toNumber());
};

const getConstraintLabel = (constraint: RecipientConstraint) => {
  const identityLabel = constraint.identity.address;
  let constraintLabel = identityLabel;

  try {
    constraintLabel = constraint.identity.toIAddress();
  } catch {
    constraintLabel = identityLabel;
  }

  if (constraint.type === RecipientConstraint.REQUIRED_SYSTEM) {
    const systemName = getSystemNameFromSystemId(constraintLabel);
    if (systemName) constraintLabel = systemName;
  }

  switch (constraint.type) {
    case RecipientConstraint.REQUIRED_ID:
      return `Required identity: ${constraintLabel}`;
    case RecipientConstraint.REQUIRED_SYSTEM:
      return `Required system: ${constraintLabel}`;
    case RecipientConstraint.REQUIRED_PARENT:
      return `Required parent: ${constraintLabel}`;
    default:
      return `Constraint: ${constraintLabel}`;
  }
};

// extractConsentDataV2 extracts display data from a GenericRequestfor the consent screen.
export const extractConsentDataV2 = (
  request: GenericRequest,
  signedBy: Identity,
  currentDetailIndex: number
): ConsentData => {
  const signerFqn = convertFqnToDisplayFormat(signedBy.fullyqualifiedname);
  const systemId = request.signature?.systemID.toIAddress() || '';

  // The generic request doesn't use permission labels since each detail displays their own info.
  const permissionsLabels = [];

  // If the first detail is an authentication detail, then we can extract information
  // from it to display with the generic request's overview.
  const ordinalWrapper = request.details[currentDetailIndex];

  let expiryLabel: string;
  let constraints: RecipientConstraint[] = [];

  let title = `${signerFqn} is requesting login with VerusID`;

  if (ordinalWrapper instanceof AuthenticationRequestOrdinalVDXFObject) {
    const authRequestDetail = ordinalWrapper.data;
    expiryLabel = getExpiryLabel(authRequestDetail);
    constraints = authRequestDetail.recipientConstraints ?? [];
  } else if (ordinalWrapper instanceof IdentityUpdateRequestOrdinalVDXFObject) {
    title = `${signerFqn} is requesting to update ${ordinalWrapper.data.identity?.name}@`;
  }

  const responseURIs = request.responseURIs ?? [];

  const constraintsLabels = constraints.map(getConstraintLabel);
  const responseURIsLabels = responseURIs.map((uri: ResponseURI) => uri.getUriString());

  return {
    title,
    signerFqn,
    permissionsLabels,
    systemId,
    expiryLabel,
    constraintsLabels,
    responseURIsLabels,
  };
};
