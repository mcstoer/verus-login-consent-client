import { IdentityUpdateRequest } from "verus-typescript-primitives";
import { API_EXECUTE_IDENTITY_UPDATE_REQUEST, NATIVE, POST } from "../../utils/constants";
import { getApiData } from "../callCreator";

// executeIdentityUpdateRequest gets the desktop wallet to run update identity
// and returns the transaction ID.
export const executeIdentityUpdateRequest = async (
  chainId: string,
  request: IdentityUpdateRequest
): Promise<string> => {
  try {
    const res = await getApiData(
      NATIVE,
      API_EXECUTE_IDENTITY_UPDATE_REQUEST,
      {
        chainTicker: chainId,
        request: request.toJson(),
      },
      POST,
      true
    );
    if (res.msg !== "success") throw new Error(res.result);
    else return res.result.txid as string;
  } catch (e) {
    console.error(e.message);
    throw new Error(e.message);
  }
};
