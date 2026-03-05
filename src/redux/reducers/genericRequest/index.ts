import {combineReducers} from '@reduxjs/toolkit';
import userDataReducer from './userDataSlice';
import appOrDelegatedIdReducer from './appOrDelegatedIdSlice';

const genericRequestReducer = combineReducers({
  userData: userDataReducer,
  appOrDelegatedId: appOrDelegatedIdReducer,
});

export default genericRequestReducer;
