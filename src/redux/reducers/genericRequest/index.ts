import {combineReducers} from '@reduxjs/toolkit';
import authDetailsReducer from './authenticationSlice';
import userDataReducer from './userDataSlice';
import appOrDelegatedIdReducer from './appOrDelegatedIdSlice';

const genericRequestReducer = combineReducers({
  authDetails: authDetailsReducer,
  userData: userDataReducer,
  appOrDelegatedId: appOrDelegatedIdReducer,
});

export default genericRequestReducer;
