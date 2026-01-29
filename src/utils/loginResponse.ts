import BigNumber from 'bignumber.js';
import {
  Context,
  Credential,
  LoginConsentDecision,
  LoginConsentRequest,
  LoginConsentResponse,
} from 'verus-typescript-primitives';
import {signResponse} from '#/rpc/calls/signResponse';

export async function createAndSignLoginResponse(
  chainId: string,
  request: LoginConsentRequest,
  loginIdentity: string,
  credentials: Credential[]
): Promise<LoginConsentResponse> {
  const context = new Context();
  for (const cred of credentials) {
    // Always create a new object since getting the credentials doesn't create the object.
    // TODO: Update this when the API is updated.
    const c = new Credential(cred);
    context.kv[cred.credentialKey] = c.toBuffer().toString('hex');
  }

  const response = new LoginConsentResponse({
    system_id: request.system_id,
    signing_id: loginIdentity,
    decision: new LoginConsentDecision({
      decision_id: request.challenge.challenge_id,
      context: context,
      request: request,
      created_at: BigNumber(Date.now()).dividedBy(1000).decimalPlaces(0).toNumber(),
    }),
  });

  const signedResponse = await signResponse(chainId, response);

  return signedResponse;
}
