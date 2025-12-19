// @ts-expect-error: the IdentityUpdateRequest was removed and needs to be re-added when the generic request is fully implemented.
import { IdentityUpdateRequest, IdentityUpdateRequestDetails } from 'verus-typescript-primitives';
import { verifyIdentityUpdateRequest } from '../rpc/calls/verifyIdentityUpdateRequest';
import { loadIdentities } from '../rpc/calls/identities';

// Checks an identity update request for validity and throws errors for any issues found
export const checkIdentityUpdateRequest = async (
  chainId: string,
  request: IdentityUpdateRequest
) => {
  const verificationCheck = await verifyIdentityUpdateRequest(chainId, request);
  if (!verificationCheck.verified) {
    throw new Error(verificationCheck.message);
  }

  // Check if the wallet owns the identity being updated.
  const details = request.details as IdentityUpdateRequestDetails;
  // Create the name without a trailing '@'.
  const name = details.identity?.name.replace(/@$/, "");;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const identities = await loadIdentities(chainId) as Array<any>;
  const found = identities.find(id => {
    return id.identity.name === name;
  });

  if (!found) {
    throw new Error(`The identity update request is for the identity ${details.identity?.name}@, which was not found in the wallet.`);
  }
};