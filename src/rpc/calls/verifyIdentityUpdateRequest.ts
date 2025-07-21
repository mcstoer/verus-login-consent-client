import { IdentityUpdateRequest } from "verus-typescript-primitives";
import { API_VERIFY_IDENTITY_UPDATE_REQUEST, NATIVE, POST } from "../../utils/constants";
import { getApiData } from "../callCreator";

export const verifyIdentityUpdateRequest = async (
  chainId: string,
  request: IdentityUpdateRequest
) => {
  try {
    const res = await getApiData(
      NATIVE,
      API_VERIFY_IDENTITY_UPDATE_REQUEST,
      {
        chainTicker: chainId,
        request: request.toJson(),
      },
      POST,
      true
    );
    if (res.msg !== "success") throw new Error(res.result);
    else return res.result;
  } catch (e) {
    console.error(e.message);
    throw new Error(e.message);
  }
};