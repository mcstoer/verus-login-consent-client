import {combineReducers} from '@reduxjs/toolkit';

import appOrDelegatedIdReducer from './appOrDelegatedIdSlice';
import userDataReducer from './userDataSlice';

const genericRequestReducer = combineReducers({
  userData: userDataReducer,
  appOrDelegatedId: appOrDelegatedIdReducer,
});

export default genericRequestReducer;
