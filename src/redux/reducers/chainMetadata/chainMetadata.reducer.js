import { SET_CHAIN_METADATA, SET_MAIN_CHAIN } from './chainMetadata.types';

const initialState = {
  chainId: '',
  chainName: '',
  mainChain: '',
};

const chainMetadata = (state = initialState, action) => {
  switch (action.type) {
  case SET_CHAIN_METADATA:
    return {
      ...state,
      ...action.payload
    };
  case SET_MAIN_CHAIN:
    return {
      ...state,
      mainChain: action.payload
    };
  default:
    return state;
  }
};

export default chainMetadata;