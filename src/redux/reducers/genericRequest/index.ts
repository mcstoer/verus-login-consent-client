import {combineReducers} from '@reduxjs/toolkit';

import appOrDelegatedIdReducer from './appOrDelegatedIdSlice';
import authReducer from './authenticationSlice';
import userDataReducer from './userDataSlice';

const genericRequestReducer = combineReducers({
  authDetails: authReducer,
  userData: userDataReducer,
  appOrDelegatedId: appOrDelegatedIdReducer,
});

export default genericRequestReducer;
