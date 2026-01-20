import {combineReducers} from "@reduxjs/toolkit";
import authDetailsReducer from "./authenticationDetailSlice";

const genericRequestReducer = combineReducers({
  authDetails: authDetailsReducer,
});

export default genericRequestReducer;