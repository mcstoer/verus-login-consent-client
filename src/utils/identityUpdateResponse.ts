import {
  IdentityID,
  IdentityUpdateRequest,
  IdentityUpdateResponse,
  IdentityUpdateResponseDetails
} from "verus-typescript-primitives";
import { signIdentityUpdateResponse } from "../rpc/calls/signIdentityUpdateResponse";

export const createAndSignIdentityUpdateResponse = async (
  chainId: string,
  request: IdentityUpdateRequest,
  signingAddress: string,
  txid: string,
): Promise<IdentityUpdateResponse> => {
  const responseDetails = new IdentityUpdateResponseDetails({
    requestid: request.details.requestid,
    createdat: request.details.createdat,
    txid: Buffer.from(txid, 'hex').reverse()
  });

  const response = new IdentityUpdateResponse({
    signingid: IdentityID.fromAddress(signingAddress),
    systemid: request.systemid,
    details: responseDetails
  });

  return await signIdentityUpdateResponse(chainId, response);
};