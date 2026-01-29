import {combineReducers} from '@reduxjs/toolkit';
import authDetailsReducer from './authenticationSlice';
import userDataReducer from './userDataSlice';

const genericRequestReducer = combineReducers({
  authDetails: authDetailsReducer,
  userData: userDataReducer,
});

export default genericRequestReducer;
