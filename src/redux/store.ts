import rootReducer from './rootReducer';
import {configureStore} from '@reduxjs/toolkit';

const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['deeplink/setDeeplinkData', 'genericResponse/SET_GENERIC_RESPONSE'],
        ignoredPaths: ['deeplink.data', 'genericResponse.response', 'error.error'],
      },
    }),
});

export default store;

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;