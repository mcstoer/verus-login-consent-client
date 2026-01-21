import {combineReducers} from '@reduxjs/toolkit';
import {navigation} from './reducers/navigation/navigation.reducer';
import {rpc} from './reducers/rpc/rpc.reducer';
import {identity} from './reducers/identity/identity.reducer';
import {origin} from './reducers/origin/origin.reducer';
import {error} from './reducers/error/error.reducer';
import {provision} from './reducers/provision/provision.reducer';
import {credentials} from './reducers/credentials/credentials.reducer';
import {signatureInfo} from './reducers/signatureInfo/signatureInfo.reducer';
import {chainMetadata} from './reducers/chainMetadata/chainMetadata.reducer';
import {deeplink} from './reducers/deeplink/deeplinkSlice';
import genericResponseReducer from './reducers/genericResponse/genericResponseSlice';
import {identityUpdate} from './reducers/identityUpdate/identityUpdate.reducer';
import genericRequestReducer from './reducers/genericRequest';

const rootReducer = combineReducers({
  navigation,
  rpc,
  identity,
  origin,
  error,
  provision,
  credentials,
  signatureInfo,
  chainMetadata,
  deeplink,
  genericResponse: genericResponseReducer,
  identityUpdate,
  genericRequest: genericRequestReducer,
});

export default rootReducer;