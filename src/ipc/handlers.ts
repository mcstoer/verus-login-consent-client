import {
  GENERIC_REQUEST_DEEPLINK_VDXF_KEY,
  GenericRequest,
  LOGIN_CONSENT_REQUEST_VDXF_KEY,
  LoginConsentRequest,
  VERUSPAY_INVOICE_VDXF_KEY,
  VerusPayInvoice
} from 'verus-typescript-primitives';
import {DEVMODE, MOCK_IPC} from '#/env';
import {setMainChain} from '#/redux/reducers/chainMetadata/chainMetadata.actions';
import {setDeeplinkData} from '#/redux/reducers/deeplink/deeplinkSlice';
import {setError} from '#/redux/reducers/error/error.actions';
import {setOriginAppBuiltin, setOriginAppId} from '#/redux/reducers/origin/origin.actions';
import {setRpcExpiryMargin, setRpcPassword, setRpcPort, setRpcPostEncryption, setRpcWindowId} from '#/redux/reducers/rpc/rpc.actions';
import store from '#/redux/store';
import {IPC_INIT_MESSAGE, IPC_LOGIN_CONSENT_REQUEST_METHOD, IPC_ORIGIN_DEV, IPC_ORIGIN_DEV_LOCALHOST, IPC_ORIGIN_PRODUCTION, IPC_PUSH_MESSAGE} from '../utils/constants';
import {RPC_PASSWORD, RPC_PORT} from '#/utils/mocks';

// TODO: Move these types to a dedicated file
// Create the type that desktop uses
declare global {
  interface Window {
    bridge: {
      getSecretSync: () => {
        BuiltinSecret: string;
      };
    };
  }
}

// Temporary IPC related types until a type file is created
interface DeeplinkPayload {
  id: string;
  data: object;
}

interface OriginAppInfo {
  main_chain_ticker: string;
  search_builtin: boolean;
  id: string;
}

interface IpcInitData {
  expiry_margin: number;
  rpc_port: number;
  post_encryption: boolean;
  window_id: number;
}

interface IpcPushData {
  origin_app_info: OriginAppInfo;
  deeplink: DeeplinkPayload;
}

interface IpcInitMessage {
  type: typeof IPC_INIT_MESSAGE;
  data: IpcInitData;
}

interface IpcPushMessage {
  type: typeof IPC_PUSH_MESSAGE;
  method: string;
  data: IpcPushData;
}

type IpcMessage = IpcInitMessage | IpcPushMessage;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const parseDeeplinkByType = (deeplinkRawData: any, deeplinkId: string): LoginConsentRequest | VerusPayInvoice | GenericRequest => {
  // Always use fromJson or other similar methods when possible as some of the deeplink data has a
  // different representation between JSON and the class definition.
  switch (deeplinkId) {
  case LOGIN_CONSENT_REQUEST_VDXF_KEY.vdxfid:
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new LoginConsentRequest(deeplinkRawData as any);

  case VERUSPAY_INVOICE_VDXF_KEY.vdxfid:
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return VerusPayInvoice.fromJson(deeplinkRawData as any);

  case GENERIC_REQUEST_DEEPLINK_VDXF_KEY.vdxfid: {
    // The generic request is sent as the QR string to be base64 encoded.
    const req = GenericRequest.fromQrString(deeplinkRawData);
    return req;
  }
  default:
    throw new Error(`Unsupported deeplink ID: ${deeplinkId}`);
  }
};

const updateReduxStore = (data: IpcPushMessage): void => {
  // Add the name of daemon guaranteed to be running on desktop so
  // it can be used to look up other chains.
  store.dispatch(
    setMainChain(data.data.origin_app_info.main_chain_ticker)
  );

  const deeplinkData = parseDeeplinkByType(
    data.data.deeplink.data,
    data.data.deeplink.id
  );

  store.dispatch(
    setDeeplinkData({
      id: data.data.deeplink.id,
      data: deeplinkData
    })
  );

  store.dispatch(setOriginAppBuiltin(data.data.origin_app_info.search_builtin));
  store.dispatch(setOriginAppId(data.data.origin_app_info.id));
};

const setupRpcConfig = (data: IpcInitMessage | null = null): void => {
  try {
    if (MOCK_IPC) {
      store.dispatch(setRpcExpiryMargin(60000));
      store.dispatch(setRpcPort(RPC_PORT));
      store.dispatch(setRpcPostEncryption(true));
      store.dispatch(setRpcWindowId(1));
      store.dispatch(setRpcPassword(RPC_PASSWORD));
    } else {
      if (data) {
        store.dispatch(setRpcExpiryMargin(data.data.expiry_margin));
        store.dispatch(setRpcPort(data.data.rpc_port));
        store.dispatch(setRpcPostEncryption(data.data.post_encryption));
        store.dispatch(setRpcWindowId(data.data.window_id));
      }
      store.dispatch(setRpcPassword(window.bridge.getSecretSync().BuiltinSecret));
    }
  } catch (e) {
    console.error("Error loading api secrets!");
    console.error(e);
    throw e;
  }
};

export const handleIpc = async (event: MessageEvent): Promise<void> => {
  try {
    if (
      typeof event.data === "string" &&
      ((!DEVMODE && event.origin === IPC_ORIGIN_PRODUCTION) ||
        (DEVMODE && event.origin === IPC_ORIGIN_DEV ||
        (DEVMODE && event.origin === IPC_ORIGIN_DEV_LOCALHOST)
        ))
    ) {
      const data = JSON.parse(event.data) as IpcMessage;

      if (data.type === IPC_INIT_MESSAGE) {
        setupRpcConfig(data as IpcInitMessage);
      } else if (
        data.type === IPC_PUSH_MESSAGE &&
        data.method === IPC_LOGIN_CONSENT_REQUEST_METHOD
      ) {
        setupRpcConfig();
        updateReduxStore(data as IpcPushMessage);
      }
    } else if (typeof event.data === "string") {
      console.log(`[IPC] recieved event message from unapproved origin (${event.origin}), blocked`);
    }
  } catch(e) {
    console.error(e);
    store.dispatch(setError(new Error((e as Error).message)));
  }
};
