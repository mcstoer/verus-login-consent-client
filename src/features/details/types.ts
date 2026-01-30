import {AppDispatch, RootState} from '#/redux/store';
import {GenericRequest, OrdinalVDXFObject} from 'verus-typescript-primitives';

export type DetailPrepFunction = (
  ordinal: OrdinalVDXFObject,
  detailIndex: number,
  dispatch: AppDispatch,
  getState: () => RootState
) => Promise<void>;

export type DetailResponseGenerator = (
  request: GenericRequest,
  detailIndex: number,
  getState: () => RootState
) => OrdinalVDXFObject | null;
