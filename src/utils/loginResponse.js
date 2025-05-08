import BigNumber from 'bignumber.js';
import { 
  Context,
  Credential,
  LoginConsentDecision,
  LoginConsentResponse
} from 'verus-typescript-primitives';
import { signResponse } from '../rpc/calls/signResponse';

// Creates a LoginConsentResponse using a LoginConsentRequest and signs it by calling the main app.
export const createAndSignLoginResponse = async (request, loginIdentity, credentials) => {

  const context = new Context();
  for (const cred of credentials) {
    const c = new Credential(cred);
    context.kv[cred.credentialKey] = c.toBuffer().toString('hex');
  }

  let response = new LoginConsentResponse({
    system_id: request.system_id,
    signing_id: loginIdentity,
    decision: new LoginConsentDecision({
      decision_id: request.challenge.challenge_id,
      context: context,
      request: request,
      created_at: BigNumber(Date.now())
        .dividedBy(1000)
        .decimalPlaces(0)
        .toNumber(),
    })
  });

  // Include the chainTicker to tell the main app which chain to sign the response on.
  response.chainTicker = request.chainTicker;
  const signedResponse = await signResponse(response);

  return signedResponse;
};

