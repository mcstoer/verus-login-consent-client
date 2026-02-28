import {
  AuthenticationRequestOrdinalVDXFObject,
  AuthenticationResponseDetails,
  AuthenticationResponseOrdinalVDXFObject,
  GenericRequest,
} from 'verus-typescript-primitives';

export async function generateAuthenticationResponse(
  request: GenericRequest,
  detailIndex: number
): Promise<AuthenticationResponseOrdinalVDXFObject | null> {
  const ordinalWrapper = request.details[detailIndex];

  if (!(ordinalWrapper instanceof AuthenticationRequestOrdinalVDXFObject)) {
    throw new Error('Detail is not an AuthenticationRequestOrdinalVDXFObject.');
  }

  const authRequestDetail = ordinalWrapper.data;

  const authResponseDetail = new AuthenticationResponseOrdinalVDXFObject({
    data: new AuthenticationResponseDetails({
      requestID: authRequestDetail.requestID,
    }),
  });

  return authResponseDetail;
}
