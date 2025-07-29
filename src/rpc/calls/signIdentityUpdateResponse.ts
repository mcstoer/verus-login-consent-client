import { IdentityUpdateResponse } from "verus-typescript-primitives";
import { API_SIGN_IDENTITY_UPDATE_RESPONSE, NATIVE, POST } from "../../utils/constants";
import { getApiData } from "../callCreator";

export const signIdentityUpdateResponse = async (
  chainId: string,
  identityUpdateResponse: IdentityUpdateResponse
): Promise<IdentityUpdateResponse>=> {
  try {
    const res = await getApiData(
      NATIVE,
      API_SIGN_IDENTITY_UPDATE_RESPONSE,
      {
        chainTicker: chainId,
        response: identityUpdateResponse.toJson(),
      },
      POST,
      true
    );
    if (res.msg !== "success") throw new Error(res.result);
    else {
      const response = IdentityUpdateResponse.fromJson(res.result.response);
      return response;
    }
  } catch (e) {
    console.error(e.message);
    throw new Error(e.message);
  }
};
