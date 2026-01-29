// TODO: Possibly remove the reducer if not needed.
import {RootState} from '#/redux/store';
import {createEntityAdapter, createSlice} from '@reduxjs/toolkit';

// Track the details by the index in the request array
interface AuthDetail {
  index: number;
  data: string;
}

const authDetailsAdapter = createEntityAdapter<AuthDetail>({
  selectId: (detail) => detail.index,
});

const authDetailsSlice = createSlice({
  name: 'authDetails',
  initialState: authDetailsAdapter.getInitialState(),
  reducers: {
    detailAdded: authDetailsAdapter.addOne,
    detailsReceived: authDetailsAdapter.setMany,
    detailUpdated: authDetailsAdapter.updateOne,
  },
});

export const {
  selectById: selectDetailById,
  selectTotal: selectDetailCount,
} = authDetailsAdapter.getSelectors((state: RootState) => state.genericRequest.authDetails);

export const {detailAdded, detailsReceived} = authDetailsSlice.actions;
export default authDetailsSlice.reducer;