import {
  AuthenticationRequestOrdinalVDXFObject,
  AuthenticationResponseDetails,
  AuthenticationResponseOrdinalVDXFObject,
} from 'verus-typescript-primitives';
import {DetailPrepFunction, DetailResponseGenerator} from './types';

export const prepareAuthenticationDetail: DetailPrepFunction = async () => {
  console.log('No prep function needed for authentication request detail');
  return;
};

export const generateAuthenticationResponse: DetailResponseGenerator = (
  request,
  detailIndex,
  getState
) => {
  const state = getState();
  const ordinalWrapper = request.details[detailIndex];

  if (!(ordinalWrapper instanceof AuthenticationRequestOrdinalVDXFObject)) {
    throw new Error('Detail is not an AuthenticationRequestOrdinalVDXFObject');
  }

  const authRequestDetail = ordinalWrapper.data;

  console.log('Generating authentication response from state:', {
    activeIdentity: state.identity.activeIdentity,
    detailIndex,
  });

  const authResponseDetail = new AuthenticationResponseOrdinalVDXFObject({
    data: new AuthenticationResponseDetails({
      requestID: authRequestDetail.requestID,
    }),
  });

  return authResponseDetail;
};
