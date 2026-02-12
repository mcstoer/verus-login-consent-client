import {
  DataDescriptor,
  DataPacketResponseOrdinalVDXFObject,
  GenericRequest,
  UserSpecificDataPacketDetailsOrdinalVDXFObject,
} from 'verus-typescript-primitives';
import {DataPacketResponse} from 'verus-typescript-primitives/dist/vdxf/classes/datapacket/DataPacketResponse';
import {DetailPrepFunction} from './types';

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
  detailIndex: number
): Promise<DataPacketResponseOrdinalVDXFObject | null> {
  const ordinalWrapper = request.details[detailIndex];

  if (!(ordinalWrapper instanceof UserSpecificDataPacketDetailsOrdinalVDXFObject)) {
    throw new Error('Detail is not a UserSpecificDataPacketDetailsOrdinalVDXFObject');
  }

  const dataPacketDetail = ordinalWrapper.data;

  console.log('Generating data packet response from state:', {
    detailIndex,
  });

  const temporaryDataDescriptor = new DataDescriptor({
    label: 'Temporary Data Descriptor',
    mimeType: 'application/octet-stream',
    objectdata: Buffer.from([]),
  });

  const dataPacketResponse = new DataPacketResponseOrdinalVDXFObject({
    data: new DataPacketResponse({
      requestID: dataPacketDetail.detailsID,
      data: temporaryDataDescriptor,
    }),
  });

  return dataPacketResponse;
}
