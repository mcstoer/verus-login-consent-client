import {
  AppEncryptionRequestOrdinalVDXFObject,
  AuthenticationRequestOrdinalVDXFObject,
  GenericRequest,
  IdentityUpdateRequestOrdinalVDXFObject,
  ProvisionIdentityDetailsOrdinalVDXFObject,
  VERUSPAY_INVOICE_DETAILS_VDXF_ORDINAL,
  VerusPayInvoiceDetailsOrdinalVDXFObject,
} from 'verus-typescript-primitives';

import {RootState} from '#/redux/store';
import {verifyGenericRequest} from '#/rpc/calls/verifyGenericRequest';
import {Identity} from '#/types/identity';

/*
 * Checks the validity of a generic request and throws errors for any issues found.
 */
export async function checkGenericRequest(
  chainId: string,
  request: GenericRequest,
  getState: () => RootState
) {
  if (!request.isValidVersion()) {
    throw new Error(`The request version ${request.version} is unsupported.`);
  }

  if (request.details.length === 0) {
    throw new Error('The request contains no details.');
  }

  if (!validateDetailStructure(request)) {
    throw new Error('The detail structure within the request is not valid.');
  }

  if (!request.isSigned()) {
    // Only generic requests with VerusPay invoices are allowed to be unsigned.
    if (
      request.hasMultiDetails() ||
      !request.details[0].type.eq(VERUSPAY_INVOICE_DETAILS_VDXF_ORDINAL)
    ) {
      throw new Error('The request is not signed.');
    }

    if (request.hasAppOrDelegatedID()) {
      throw new Error('The request has an app or delegated ID and must be signed.');
    }
  } else {
    // Verify the signature of the generic request.
    const verificationResult = await verifyGenericRequest(chainId, request);
    if (!verificationResult.verified) {
      throw new Error(verificationResult.message);
    }

    if (request.hasAppOrDelegatedID()) {
      // Check the signing identity is in the wallet, so that the appOrDelegatedId is allowed
      const signingId = request.signature.identityID.toIAddress();
      const identities = getState().identity.identities as Identity[];
      const found = identities.find(id => {
        return id.identity.identityaddress === signingId;
      });

      if (!found) {
        throw new Error(
          `The signing identity is not in the wallet, so having an app or delegated ID is not allowed.`
        );
      }
    }
  }
}

// Validates that the details of the generic request follow required rules of
// ordering and presence of other details when necessary.
function validateDetailStructure(request: GenericRequest): boolean {
  const details = request.details;

  if (!Array.isArray(details)) {
    return false;
  }

  let authIndex = -1;
  let appEncryptionIndex = -1;
  let provisioningIndex = -1;
  let transactionIndex = -1;

  for (let i = 0; i < details.length; i++) {
    const ordinal = details[i];

    if (ordinal instanceof AuthenticationRequestOrdinalVDXFObject) {
      if (authIndex !== -1) {
        return false;
      }
      authIndex = i;
    }

    if (ordinal instanceof AppEncryptionRequestOrdinalVDXFObject) {
      if (appEncryptionIndex !== -1) {
        return false;
      }
      appEncryptionIndex = i;
    }

    if (ordinal instanceof ProvisionIdentityDetailsOrdinalVDXFObject) {
      if (provisioningIndex !== -1) {
        return false;
      }
      provisioningIndex = i;
    }

    if (
      ordinal instanceof VerusPayInvoiceDetailsOrdinalVDXFObject ||
      ordinal instanceof IdentityUpdateRequestOrdinalVDXFObject
    ) {
      if (transactionIndex !== -1) {
        return false;
      }
      transactionIndex = i;
    }
  }

  const hasAuth = authIndex !== -1;
  const hasAppEncryption = appEncryptionIndex !== -1;
  const hasProvisioning = provisioningIndex !== -1;
  const hasTransaction = transactionIndex !== -1;

  if (hasAuth && authIndex !== 0) {
    return false;
  }

  if (hasAppEncryption && !hasAuth) {
    return false;
  }

  if (hasProvisioning && !hasAuth) {
    return false;
  }

  // Details that create a transaction must be the last detail.
  if (hasTransaction && transactionIndex !== details.length - 1) {
    return false;
  }

  return true;
}
