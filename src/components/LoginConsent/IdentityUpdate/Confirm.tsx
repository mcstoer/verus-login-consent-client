import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemButton from '@mui/material/ListItemButton';
import Collapse from '@mui/material/Collapse';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import PageLayout from '../../common/PageLayout';
import { setNavigationPath } from '../../../redux/reducers/navigation/navigation.actions';
import { IDENTITY_UPDATE_CORE } from '../../../utils/constants';
import { unixToDate } from '../../../utils/math';
import { convertFqnToDisplayFormat } from '../../../utils/fullyqualifiedname';
import { createIdentityDescriptor } from '../../../utils/identity';
import { IdentityUpdateRequest } from 'verus-typescript-primitives';
import { SignatureInfoState } from '../../../redux/reducers/signatureInfo/signatureInfo.types';

interface IdentityUpdateConfirmProps {
  completeLoginConsent: () => Promise<void>;
}

const IdentityUpdateConfirm: React.FC<IdentityUpdateConfirmProps> = (props) => {
  const { completeLoginConsent } = props;
  const dispatch = useDispatch();
  const [loading, setLoading] = useState<boolean>(false);
  const [openIdentity, setOpenIdentity] = useState<boolean>(false);

  // The root state is not implemented in TypeScript yet, so we need `any`.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const deeplinkData: IdentityUpdateRequest = useSelector((state: any) => state.deeplink.data);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chainName: string = useSelector((state: any) => state.chainMetadata.chainName);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const signatureInfo: SignatureInfoState = useSelector((state: any) => state.signatureInfo);

  const { sigBlockInfo, signedBy, signingRevocationIdentity, signingRecoveryIdentity } = signatureInfo || {};
  const { time } = sigBlockInfo || {};

  // Convert the fully qualified name into a nicer format for VRSC
  const signerFqn = signedBy?.fullyqualifiedname ? convertFqnToDisplayFormat(signedBy.fullyqualifiedname) : '';
  const systemDescriptor = `${chainName} (${deeplinkData.systemid.toAddress()})`;

  const handleIdentityClick = () => {
    setOpenIdentity(!openIdentity);
  };

  const IdentityDetailItem: React.FC<{ field: string; value: string }> = ({ field, value }) => (
    <ListItem divider sx={{ pl: 6, pr: 2, py: 0.5, minHeight: 48 }}>
      <ListItemText
        primary={value}
        secondary={field}
        slotProps={{
          primary: { variant: 'body2', sx: { lineHeight: 1.3 } },
          secondary: { color: 'text.secondary', variant: 'caption', sx: { lineHeight: 1.2 } }
        }}
      />
    </ListItem>
  );

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
          //marginTop: 1,
          //marginBottom: 1,
          width: '100%',
          maxHeight: '60vh',
          overflowY: 'auto',
        }}
      >
        <CardContent>
          <List>
            <ListItemButton
              divider
              onClick={handleIdentityClick}
            >
              <ListItemText
                primary={signerFqn && signedBy?.identity?.identityaddress
                  ? `${signerFqn} (${signedBy.identity.identityaddress})`
                  : '-'
                }
                secondary="Requested by"
                slotProps={{
                  primary: { variant: 'subtitle1' },
                  secondary: { color: 'text.secondary', variant: 'body2' }
                }}
              />
              {openIdentity ? <ExpandLess color="action" /> : <ExpandMore color="action" />}
            </ListItemButton>

            <Collapse in={openIdentity} timeout="auto" unmountOnExit>
              <List
                component="div"
                dense
                disablePadding
              >
                <IdentityDetailItem
                  field="Name"
                  value={(signedBy?.identity?.name as string) || '-'}
                />
                <IdentityDetailItem
                  field="Identity Address"
                  value={signedBy?.identity?.identityaddress || '-'}
                />
                <IdentityDetailItem
                  field="Status"
                  value={(signedBy?.status as string) || '-'}
                />
                <IdentityDetailItem
                  field="Revocation Authority"
                  value={createIdentityDescriptor(signingRevocationIdentity)}
                />
                <IdentityDetailItem
                  field="Recovery Authority"
                  value={createIdentityDescriptor(signingRecoveryIdentity)}
                />
                <IdentityDetailItem
                  field="System"
                  value={systemDescriptor}
                />
                {signedBy?.identity?.primaryaddresses?.[0] && (
                  <IdentityDetailItem
                    field="Primary Address #1"
                    value={signedBy.identity.primaryaddresses[0] as string}
                  />
                )}
              </List>
            </Collapse>

            <ListItem divider>
              <ListItemText
                primary={systemDescriptor || '-'}
                secondary="System name"
                slotProps={{
                  primary: { variant: 'subtitle1' },
                  secondary: { color: 'text.secondary', variant: 'body2' }
                }}
              />
            </ListItem>

            <ListItem>
              <ListItemText
                primary={time ? unixToDate(time) : '-'}
                secondary="Signed on"
                slotProps={{
                  primary: { variant: 'subtitle1' },
                  secondary: { color: 'text.secondary', variant: 'body2' }
                }}
              />
            </ListItem>
          </List>
        </CardContent>
      </Card>
    </PageLayout>
  );
};

export default IdentityUpdateConfirm;
