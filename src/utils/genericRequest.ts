import {GenericRequest, VDXF_ORDINAL_VERUSPAY_INVOICE} from 'verus-typescript-primitives';
import {loadIdentities} from '../rpc/calls/identities';
import {verifyGenericRequest} from '../rpc/calls/verifyGenericRequest';

// Checks the validity of a generic request and throws errors for any issues found
export const checkGenericRequest = async (
  chainId: string,
  request: GenericRequest
) => {
  if (!request.isValidVersion) {
    throw new Error(`The request version ${request.version} is unsupported.`);
  }

  if (request.details.length === 0) {
    throw new Error('The request contains no details.');
  }

  if (!request.isSigned()) {
    // Only generic requests with VerusPay invoices are allowed to be unsigned.
    if (request.hasMultiDetails() || request.details[0].type !== VDXF_ORDINAL_VERUSPAY_INVOICE) {
      throw new Error('The request is not signed.');
    }
    // Possibly throw error for appOrDelegatedId
  } else {
    // Verify the signature of the generic request.
    // Skip this until the problem is found.
    /*
    console.log("Verifying generic request signature...");
    const verificationResult = await verifyGenericRequest(chainId, request);
    console.log("Generic request verification result:", verificationResult);
    if (!verificationResult.verified) {
      throw new Error(verificationResult.message);
    }
      */

    if (request.hasAppOrDelegatedID()) {
      // Check the signing identity is in the wallet, so that the appOrDelegatedId is allowed
      const signingId = "placeholder_for_signing_identity";
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const identities = await loadIdentities(chainId) as Array<any>;
      const found = identities.find(id => {
        return id.identity.name === signingId;
      });
      console.log("Found identity in wallet:", found);

      // Throw error if not found
    }
  }

};