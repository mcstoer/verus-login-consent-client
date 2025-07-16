import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import PageLayout from '../../common/PageLayout';
import { setNavigationPath } from '../../../redux/reducers/navigation/navigation.actions';
import { IDENTITY_UPDATE_CORE } from '../../../utils/constants';
import { unixToDate } from '../../../utils/math';
import { convertFqnToDisplayFormat } from '../../../utils/fullyqualifiedname';
import { IdentityUpdateRequest } from 'verus-typescript-primitives';
import { SignatureInfoState } from '../../../redux/reducers/signatureInfo/signatureInfo.types';

interface IdentityUpdateConfirmProps {
  completeLoginConsent: () => Promise<void>;
}

const IdentityUpdateConfirm: React.FC<IdentityUpdateConfirmProps> = (props) => {
  const { completeLoginConsent } = props;
  const dispatch = useDispatch();
  const [loading, setLoading] = useState<boolean>(false);

  // The root state is not implemented in TypeScript yet, so we need `any`.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const deeplinkData: IdentityUpdateRequest = useSelector((state: any) => state.deeplink.data);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chainName: string = useSelector((state: any) => state.chainMetadata.chainName);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const signatureInfo: SignatureInfoState = useSelector((state: any) => state.signatureInfo);

  const { sigBlockInfo, signedBy } = signatureInfo || {};
  const { time } = sigBlockInfo || {};
  
  // Convert the fully qualified name into a nicer format for VRSC
  const signerFqn = signedBy?.fullyqualifiedname ? convertFqnToDisplayFormat(signedBy.fullyqualifiedname) : '';
  const systemDescriptor = `${chainName} (${deeplinkData.systemid})`;

  const handleNext = async (): Promise<void> => {
    setLoading(true);
    dispatch(setNavigationPath(IDENTITY_UPDATE_CORE));
  };

  const cancel = async (): Promise<void> => {
    setLoading(true);
    await completeLoginConsent();
  };

  return (
    <PageLayout
      title="Review the Identity Update Request"
      contentStyle={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2
      }}
      footerContent={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
          <Button
            variant="text"
            disabled={loading}
            color="secondary"
            onClick={() => cancel()}
            style={{
              width: 120,
              padding: 8,
            }}
          >
            {"Cancel"}
          </Button>
          <Button
            variant="contained"
            disabled={loading}
            color="primary"
            onClick={() => handleNext()}
            style={{
              width: 120,
              padding: 8,
            }}
          >
            {"Next"}
          </Button>
        </div>
      }
    >
      <Card 
        square 
        sx={{
          marginTop: 1,
          marginBottom: 1,
          width: '100%',
          maxHeight: '60vh',
          overflowY: 'auto',
        }}
      >
        <List>
          <ListItem divider>
            <ListItemText
              primary={signerFqn && signedBy?.identity?.identityaddress 
                ? `${signerFqn} (${signedBy.identity.identityaddress})`
                : 'Loading...'
              }
              secondary="Requested by"
              slotProps={{ secondary: { color: 'text.secondary' } }}
            />
          </ListItem>

          <ListItem divider>
            <ListItemText
              primary={systemDescriptor || 'Loading...'}
              secondary="System name"
              slotProps={{ secondary: { color: 'text.secondary' } }}
            />
          </ListItem>

          <ListItem>
            <ListItemText
              primary={time ? unixToDate(time) : 'Loading...'}
              secondary="Signed on"
              slotProps={{ secondary: { color: 'text.secondary' } }}
            />
          </ListItem>
        </List>
      </Card>
    </PageLayout>
  );
};

export default IdentityUpdateConfirm;
