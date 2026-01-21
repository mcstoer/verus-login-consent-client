import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {GenericResponse, OrdinalVDXFObject} from 'verus-typescript-primitives';

export interface GenericResponseState {
  response: GenericResponse | null;
  currentDetailIndex: number;
}

const initialState: GenericResponseState = {
  response: null,
  currentDetailIndex: 0,
};

const genericResponseSlice = createSlice({
  name: 'genericResponse',
  initialState,
  reducers: {
    setGenericResponse: (state, action: PayloadAction<GenericResponse>) => {
      state.response = action.payload;
    },
    setCurrentDetailIndex: (state, action: PayloadAction<number>) => {
      state.currentDetailIndex = action.payload;
    },
    updateCurrentDetail: (state, action: PayloadAction<OrdinalVDXFObject>) => {
      if (!state.response) {
        return;
      }
      // Create a clone to avoid mutating state directly
      // Note: GenericResponse is a class instance, so we need to clone it properly
      const responseClone = new GenericResponse();
      responseClone.fromBuffer(state.response.toBuffer());
      responseClone.details[state.currentDetailIndex] = action.payload;
      state.response = responseClone;
    },
    completeCurrentDetail: (state, action: PayloadAction<OrdinalVDXFObject>) => {
      if (!state.response) {
        return;
      }
      // Create a clone to avoid mutating state directly
      const responseClone = new GenericResponse();
      responseClone.fromBuffer(state.response.toBuffer());
      responseClone.details[state.currentDetailIndex] = action.payload;
      state.response = responseClone;
      state.currentDetailIndex += 1;
    },
    updateResponseDetails: (state, action: PayloadAction<OrdinalVDXFObject[]>) => {
      if (!state.response) {
        return;
      }
      // Create a clone and update its details
      const responseClone = new GenericResponse();
      responseClone.fromBuffer(state.response.toBuffer());
      responseClone.details = action.payload;
      state.response = responseClone;
    },
  },
});

export const {
  setGenericResponse,
  setCurrentDetailIndex,
  updateCurrentDetail,
  completeCurrentDetail,
  updateResponseDetails,
} = genericResponseSlice.actions;

export default genericResponseSlice.reducer;
