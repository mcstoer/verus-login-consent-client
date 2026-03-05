import {getApiData} from '#/rpc/callCreator';
import {API_Z_GET_ENCRYPTION_ADDRESS, NATIVE, POST} from '#/utils/constants';

interface ApiResponse {
  msg: string;
  result: unknown;
}

interface ZGetEncryptionAddressParams {
  address?: string;
  seed?: string;
  hdindex?: number;
  rootkey?: string;
  fromid?: string;
  toid?: string;
  encryptionindex?: number;
  returnsecret?: boolean;
}

export interface ZGetEncryptionAddressResult {
  extendedviewingkey: string;
  incomingviewingkey: string;
  address: string;
  extendedspendingkey?: string;
}

export async function zGetEncryptionAddress(
  chainId: string,
  params: ZGetEncryptionAddressParams
): Promise<ZGetEncryptionAddressResult> {
  try {
    const res = (await getApiData(
      NATIVE,
      API_Z_GET_ENCRYPTION_ADDRESS,
      {
        coin: chainId,
        ...(params || {}),
      },
      POST,
      true
    )) as ApiResponse;

    if (res.msg !== 'success') {
      throw new Error(res.result as string);
    }

    return res.result as ZGetEncryptionAddressResult;
  } catch (e) {
    const error = e as Error;
    console.error(error.message);
    throw new Error(error.message);
  }
}
