import { IdentityUpdateRequest } from 'verus-typescript-primitives';
import { verifyIdentityUpdateRequest } from '../rpc/calls/verifyIdentityUpdateRequest';

// Checks an identity update request for validity and throws errors for any issues found
export const checkIdentityUpdateRequest = async (
  chainId: string,
  request: IdentityUpdateRequest
) => {
  const verificationCheck = await verifyIdentityUpdateRequest(chainId, request);
  if (!verificationCheck.verified) {
    throw new Error(verificationCheck.message);
  }
};