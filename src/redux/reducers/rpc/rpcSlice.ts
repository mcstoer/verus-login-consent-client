import {setError} from '#/redux/reducers/error/error.actions';
import {RootState} from '#/redux/store';
import {closePlugin} from '#/rpc/calls/closePlugin';
import {VERUS_LOGIN_CONSENT_UI} from '#/utils/constants';
import {createSlice, PayloadAction, ThunkAction} from '@reduxjs/toolkit';

export interface RpcState {
  port: number | string | null;
  password: string | null;
  expiryMargin: number;
  appId: string;
  calledTimes: number[];
  postEncryption: boolean;
  windowId: number | null;
}

const initialState: RpcState = {
  port: null,
  password: null,
  expiryMargin: 60000,
  appId: VERUS_LOGIN_CONSENT_UI,
  calledTimes: [],
  postEncryption: true,
  windowId: null,
};

const rpcSlice = createSlice({
  name: 'rpc',
  initialState,
  reducers: {
    setRpcAppId: (state, action: PayloadAction<string>) => {
      state.appId = action.payload;
    },
    setRpcPassword: (state, action: PayloadAction<string>) => {
      state.password = action.payload;
    },
    setRpcPort: (state, action: PayloadAction<number | string>) => {
      state.port = action.payload;
    },
    setRpcExpiryMargin: (state, action: PayloadAction<number>) => {
      state.expiryMargin = action.payload;
    },
    setRpcPostEncryption: (state, action: PayloadAction<boolean>) => {
      state.postEncryption = action.payload;
    },
    setRpcWindowId: (state, action: PayloadAction<number>) => {
      state.windowId = action.payload;
    },
    addCalledTime: (state, action: PayloadAction<number>) => {
      const time = action.payload;
      let newCalledTimes = [...state.calledTimes, time];
      newCalledTimes = newCalledTimes.filter(
        (x) => x > time - state.expiryMargin && x < time + state.expiryMargin,
      );
      state.calledTimes = newCalledTimes;
    },
  },
});

type CompleteRequestThunk = ThunkAction<
  Promise<void>,
  RootState,
  unknown,
  ReturnType<typeof setError>
>;

export function completeRequest(result?: unknown, error?: Error | null): CompleteRequestThunk {
  return async (dispatch, getState) => {
    try {
      const state = getState();
      const windowId = state.rpc.windowId;

      await closePlugin(
        VERUS_LOGIN_CONSENT_UI,
        windowId,
        true,
        result ?? {error: error?.message ?? error},
      );
    } catch (e: unknown) {
      dispatch(setError(e));
    }
  };
}

export const {
  setRpcAppId,
  setRpcPassword,
  setRpcPort,
  setRpcExpiryMargin,
  setRpcPostEncryption,
  setRpcWindowId,
  addCalledTime,
} = rpcSlice.actions;

export const rpc = rpcSlice.reducer;
