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
import {deeplink} from './reducers/deeplink/deeplink.reducer';
import {genericResponse} from './reducers/genericResponse/genericResponse.reducer';
import {identityUpdate} from './reducers/identityUpdate/identityUpdate.reducer';

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
  genericResponse,
  identityUpdate,
});

export default rootReducer;