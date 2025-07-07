/*
  This reducer contains information about what chains are being used.
*/
import { SET_CHAIN_METADATA, SET_MAIN_CHAIN } from './chainMetadata.types';

export const setChainMetadata = (chainMetadata) => ({
  type: SET_CHAIN_METADATA,
  payload: chainMetadata
});

export const setMainChain = (mainChain) => ({
  type: SET_MAIN_CHAIN,
  payload: mainChain
});