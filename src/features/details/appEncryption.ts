import {RootState} from '#/redux/store';
import {encryptAppEncryptionResponse} from '#/rpc/calls/encryptAppEncryptionResponse';
import {executeAppEncryptionRequest} from '#/rpc/calls/executeAppEncryptionRequest';
import {
  AppEncryptionRequestDetails,
  AppEncryptionRequestOrdinalVDXFObject,
  AppEncryptionResponseDetails,
  AppEncryptionResponseOrdinalVDXFObject,
  DataDescriptor,
  DataResponseOrdinalVDXFObject,
  GenericRequest,
  OrdinalVDXFObject,
} from 'verus-typescript-primitives';
import {DataResponseDetails} from 'verus-typescript-primitives/dist/vdxf/classes/data/DataResponseDetails';
import {DetailPrepFunction, DetailResponse} from './types';

export const prepareAppEncryptionDetail: DetailPrepFunction = async (
  ordinal: OrdinalVDXFObject
) => {
  if (!(ordinal instanceof AppEncryptionRequestOrdinalVDXFObject)) {
    throw new Error('Detail is not an AppEncryptionRequestOrdinalVDXFObject');
  }

  const detail: AppEncryptionRequestDetails = ordinal.data;

  if (!detail.isValid()) {
    throw new Error('Invalid app encryption request detail.');
  }

  // TODO: See if we need to check the active identity here.
};

export async function generateAppEncryptionResponse(
  request: GenericRequest,
  detailIndex: number,
  getState: () => RootState
): Promise<DetailResponse> {
  const ordinalWrapper = request.details[detailIndex];

  if (!(ordinalWrapper instanceof AppEncryptionRequestOrdinalVDXFObject)) {
    throw new Error('Detail is not an AppEncryptionRequestOrdinalVDXFObject.');
  }

  const requestDetail: AppEncryptionRequestDetails = ordinalWrapper.data;

  const state = getState();
  const chainId = state.chainMetadata.chainId;
  const signingIdentity = state.identity.activeIdentity;

  if (!signingIdentity) {
    throw new Error('No active identity available for app encryption.');
  }

  const fromID = signingIdentity.identity.identityaddress;
  const toID = signingIdentity.identity.identityaddress;

  const appEncryptionResult = await executeAppEncryptionRequest(
    chainId,
    requestDetail,
    fromID,
    toID
  );

  let responseOrdinal: DataResponseOrdinalVDXFObject | AppEncryptionResponseOrdinalVDXFObject;

  // Use fromJson since the main app returns the keys as strings and we store them as strings.
  const responseData = AppEncryptionResponseDetails.fromJson({
    version: 1,
    incomingviewingkey: appEncryptionResult.incomingViewingKey,
    extendedviewingkey: appEncryptionResult.extendedViewingKey,
    address: appEncryptionResult.address,
    extendedspendingkey: appEncryptionResult.extendedSpendingKey,
  });

  // toJson doesn't work with the CompactIAddressObject, so just add it in after we
  // create the response data.
  responseData.requestID = requestDetail.requestID;

  if (requestDetail.hasEncryptResponseToAddress()) {
    // Store the AppEncryptionResponse detail within the DataPacketResponse so that
    // the keys can be encrypted for secure transit.
    const encryptedDataDescriptorJson = await encryptAppEncryptionResponse(
      chainId,
      responseData,
      fromID,
      requestDetail.encryptResponseToAddress.toAddressString()
    );

    const encryptedDataDescriptor = DataDescriptor.fromJson(encryptedDataDescriptorJson);

    const encryptedResponseDetail = new DataResponseDetails({
      requestID: requestDetail.requestID,
      data: encryptedDataDescriptor,
    });

    responseOrdinal = new DataResponseOrdinalVDXFObject({
      data: encryptedResponseDetail,
    });
  } else {
    responseOrdinal = new AppEncryptionResponseOrdinalVDXFObject({
      data: responseData,
    });
  }

  return responseOrdinal;
}
