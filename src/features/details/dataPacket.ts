import {
  DataDescriptor,
  DataPacketResponseOrdinalVDXFObject,
  GenericRequest,
  UserSpecificDataPacketDetailsOrdinalVDXFObject,
  VdxfUniValue,
  SignatureData,
  SignatureDataKey,
} from 'verus-typescript-primitives';
import {DataPacketResponse} from 'verus-typescript-primitives/dist/vdxf/classes/datapacket/DataPacketResponse';
import {DetailPrepFunction} from './types';
import {signData} from '#/rpc/calls/signData';
import {RootState} from '#/redux/store';
import {Identity} from '#/redux/reducers/signatureInfo/signatureInfo.types';

export const prepareDataPacketDetail: DetailPrepFunction = async ordinal => {
  if (!(ordinal instanceof UserSpecificDataPacketDetailsOrdinalVDXFObject)) {
    throw new Error('Detail is not a UserSpecificDataPacketDetailsOrdinalVDXFObject');
  }

  const dataPacketDetail = ordinal.data;

  if (!dataPacketDetail.isValid()) {
    throw new Error('UserSpecificDataPacketDetails is not valid');
  }
};

export async function generateDataPacketResponse(
  request: GenericRequest,
  detailIndex: number,
  getState: () => RootState
): Promise<DataPacketResponseOrdinalVDXFObject | null> {
  const ordinalWrapper = request.details[detailIndex];

  if (!(ordinalWrapper instanceof UserSpecificDataPacketDetailsOrdinalVDXFObject)) {
    throw new Error('Detail is not a UserSpecificDataPacketDetailsOrdinalVDXFObject');
  }

  const state = getState();
  const chainId = state.chainMetadata.chainId;
  const signingIdentity = state.identity.activeIdentity as Identity;

  const dataPacketDetail = ordinalWrapper.data;

  console.log('Generating data packet response from state:', {
    detailIndex,
  });

  // Create signatures for each data descriptor and store them in a single VdxfUniValue.
  const values = [];

  for (const signableObject of dataPacketDetail.signableObjects) {
    let messageToSign: string;
    if (signableObject.mimeType?.startsWith('text/')) {
      messageToSign = signableObject.objectdata.toString('utf-8');
    } else {
      messageToSign = signableObject.objectdata.toString('hex');
    }
    try {
      const signatureResult = await signData(chainId, {
        address: signingIdentity.identity.identityaddress,
        message: messageToSign,
      });

      const signatureData = SignatureData.fromJson(signatureResult.signaturedata);

      values.push({[SignatureDataKey.vdxfid]: signatureData});
    } catch (error) {
      console.error('Error signing data:', error);
      throw error;
    }
  }

  const vdxfUniValue = new VdxfUniValue({
    values,
  });

  const dataDescriptor = new DataDescriptor({
    version: DataDescriptor.DEFAULT_VERSION,
    objectdata: vdxfUniValue.toBuffer(),
  });

  const dataPacketResponse = new DataPacketResponseOrdinalVDXFObject({
    data: new DataPacketResponse({
      requestID: dataPacketDetail.detailsID,
      data: dataDescriptor,
    }),
  });

  return dataPacketResponse;
}
