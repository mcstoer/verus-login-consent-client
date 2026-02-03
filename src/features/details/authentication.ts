import {
  AuthenticationRequestOrdinalVDXFObject,
  AuthenticationResponseDetails,
  AuthenticationResponseOrdinalVDXFObject,
  GenericRequest,
} from 'verus-typescript-primitives';
import {DetailPrepFunction} from './types';
import {RootState} from '#/redux/store';

export const prepareAuthenticationDetail: DetailPrepFunction = async () => {
  console.log('No prep function needed for authentication request detail');
  return;
};

export async function generateAuthenticationResponse(
  request: GenericRequest,
  detailIndex: number,
  getState: () => RootState
): Promise<AuthenticationResponseOrdinalVDXFObject | null> {
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
}
