import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import PageLayout from '../../common/PageLayout';
import ContentMultiMapRenderer from './ContentMultiMapRenderer';
import { setNavigationPath } from '../../../redux/reducers/navigation/navigation.actions';
import { IDENTITY_UPDATE_CORE, IDENTITY_UPDATE_RESULT } from '../../../utils/constants';
import { IdentityUpdateRequest, IdentityUpdateRequestDetails } from 'verus-typescript-primitives';
import { executeIdentityUpdateRequest } from '../../../rpc/calls/executeIdentityUpdateRequest';
import { setIdentityUpdateTxid } from '../../../redux/reducers/identityUpdate/identityUpdate.actions';

const IdentityUpdateContentMultiMap: React.FC = () => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState<boolean>(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const deeplinkData: IdentityUpdateRequest = useSelector((state: any) => state.deeplink.data);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chainId: string = useSelector((state: any) => state.chainMetadata.chainId);
  // Explicity set the type to IdentityUpdateRequestDetails since otherwise it is IdentityUpdateResponseDetails.
  const deeplinkDetails = deeplinkData.details as IdentityUpdateRequestDetails;
  const name = deeplinkDetails.identity.name;

  const contentMultiMapEntries = deeplinkDetails.identity?.content_multimap?.kv_content
    ? Array.from(deeplinkDetails.identity.content_multimap.kv_content.entries())
    : [];

  const handleFinish = async (): Promise<void> => {
    setLoading(true);
    try {
      const txid = await executeIdentityUpdateRequest(chainId, deeplinkData);
      dispatch(setIdentityUpdateTxid(txid));
      dispatch(setNavigationPath(IDENTITY_UPDATE_RESULT));
    } catch (error) {
      setLoading(false);
      throw new Error(`Failed to execute identity update: ${error instanceof Error ? error.message : error}`);
    }
  };

  const cancel = async (): Promise<void> => {
    setLoading(true);
    dispatch(setNavigationPath(IDENTITY_UPDATE_CORE));
  };

  return (
    <PageLayout
      title={`The following data will be added to the contentmultimap of your identity ${name}`}
      contentStyle={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2
      }}
      footerContent={
        <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
          <Button
            variant="text"
            disabled={loading}
            color="secondary"
            onClick={() => cancel()}
            style={{
              width: 120,
              marginRight: 32,
              padding: 8,
            }}
          >
            {"Back"}
          </Button>
          <Button
            variant="contained"
            disabled={loading}
            color="primary"
            onClick={() => handleFinish()}
            style={{
              width: 120,
              padding: 8,
            }}
          >
            {"Finish"}
          </Button>
        </div>
      }
    >
      <Card
        square
        sx={{
          width: '100%',
          maxHeight: '60vh',
          overflowY: 'auto',
        }}
      >
        <CardContent>
          <ContentMultiMapRenderer contentMultiMapEntries={contentMultiMapEntries} />
        </CardContent>
      </Card>
    </PageLayout>
  );
};

export default IdentityUpdateContentMultiMap;
