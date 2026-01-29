import { API_GET_CREDENTIALS_BY_SCOPE, NATIVE, POST } from "../../utils/constants";
import { getApiData } from "../callCreator";

/**
 * Gets the credentials from the address belonging to the scope filtered by the credentialKeys.
 */
export const getCredentialsByScope = async (chainId, address, scope, credentialKeys) => {
  try {
    const res = await getApiData(
      NATIVE,
      API_GET_CREDENTIALS_BY_SCOPE,
      {
        coin: chainId,
        address: address,
        scope: scope,
        credentialKeys: credentialKeys
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