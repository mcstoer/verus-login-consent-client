import React, {useState} from 'react';
import {useSelector} from 'react-redux';

import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Collapse from '@mui/material/Collapse';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';

import {GenericRequest, LoginConsentRequest} from 'verus-typescript-primitives';

import IdentityDetails from '#/components/Identity';
import PageLayout from '#/components/PageLayout';
import {extractConsentDataV1, extractConsentDataV2} from '#/features/login/consentDataExtractors';
import {useAppDispatch} from '#/redux/hooks';
import {checkAndUpdateIdentities} from '#/redux/reducers/identity/identity.actions';
import {
  navigateGenericRequest,
  setExternalAction,
  setNavigationPath,
} from '#/redux/reducers/navigation/navigationSlice';
import {Identity} from '#/redux/reducers/signatureInfo/signatureInfo.types';
import {RootState} from '#/redux/store';
import {EXTERNAL_ACTION, EXTERNAL_CHAIN_START, SELECT_LOGIN_ID} from '#/utils/constants';
import {unixToDate} from '#/utils/math';

interface ConsentProps {
  canProcessRequest: () => boolean;
  completeLoginConsent: () => Promise<void>;
}

const Consent: React.FC<ConsentProps> = props => {
  const {canProcessRequest, completeLoginConsent} = props;
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState<boolean>(false);
  const [openPermissions, setOpenPermissions] = useState<boolean>(false);
  const [openConstraints, setOpenConstraints] = useState<boolean>(false);
  const [openResponseURIs, setOpenResponseURIs] = useState<boolean>(false);
  const deeplinkData = useSelector((state: RootState) => state.deeplink.data);
  const currentDetailIndex = useSelector((state: RootState) => state.navigation.currentDetailIndex);
  const chainId = useSelector((state: RootState) => state.chainMetadata.chainId);
  const chainName = useSelector((state: RootState) => state.chainMetadata.chainName);
  const signatureInfo = useSelector((state: RootState) => state.signatureInfo);

  const {sigBlockInfo, signedBy, signingRevocationIdentity, signingRecoveryIdentity} =
    signatureInfo;
  const {time} = sigBlockInfo;

  const isGenericRequest = deeplinkData instanceof GenericRequest;

  const consentData = isGenericRequest
    ? extractConsentDataV2(deeplinkData, signedBy as Identity, currentDetailIndex)
    : extractConsentDataV1(deeplinkData as LoginConsentRequest, signedBy as Identity);

  const {
    signerFqn,
    permissionsLabels,
    systemId,
    constraintsLabels,
    expiryLabel,
    responseURIsLabels,
  } = consentData;
  const systemDescriptor = `${chainName} (${systemId})`;

  const handlePermissionsClick = () => {
    setOpenPermissions(!openPermissions);
  };

  const handleConstraintsClick = () => {
    setOpenConstraints(!openConstraints);
  };

  const handleResponseURIsClick = () => {
    setOpenResponseURIs(!openResponseURIs);
  };

  const tryLogin = async (): Promise<void> => {
    setLoading(true);

    const userActions = await checkAndUpdateIdentities(chainId);
    userActions.map(action => dispatch(action));

    if (canProcessRequest()) {
      if (isGenericRequest) {
        dispatch(navigateGenericRequest());
      } else {
        dispatch(setNavigationPath(SELECT_LOGIN_ID));
      }
    } else {
      dispatch(setExternalAction(EXTERNAL_CHAIN_START));
      dispatch(setNavigationPath(EXTERNAL_ACTION));
    }
  };

  const cancel = async (): Promise<void> => {
    setLoading(true);
    await completeLoginConsent();
  };

  return (
    <PageLayout
      title={`${signerFqn} is requesting login with VerusID`}
      contentStyle={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
      }}
      footerContent={
        <div style={{display: 'flex', justifyContent: 'flex-end', width: '100%'}}>
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
            {'Cancel'}
          </Button>
          <Button
            variant="contained"
            color="success"
            disabled={loading}
            onClick={() => tryLogin()}
            style={{
              width: 120,
              padding: 8,
            }}
          >
            {'Continue'}
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
          <List>
            <IdentityDetails
              identity={signedBy}
              revocationAuthority={signingRevocationIdentity}
              recoveryAuthority={signingRecoveryIdentity}
              systemDescriptor={systemDescriptor}
              headerLabel="Requested by"
            />

            <ListItem divider>
              <ListItemText
                primary={systemDescriptor || '-'}
                secondary="System name"
                slotProps={{
                  primary: {variant: 'subtitle1'},
                  secondary: {color: 'text.secondary', variant: 'body2'},
                }}
              />
            </ListItem>

            <ListItem divider>
              <ListItemText
                primary={time ? unixToDate(time) : '-'}
                secondary="Signed on"
                slotProps={{
                  primary: {variant: 'subtitle1'},
                  secondary: {color: 'text.secondary', variant: 'body2'},
                }}
              />
            </ListItem>

            {permissionsLabels && permissionsLabels.length > 0 && (
              <>
                <ListItemButton onClick={handlePermissionsClick}>
                  <ListItemText
                    primary="Permissions Requested"
                    secondary={openPermissions ? 'Click to collapse' : 'Click to expand'}
                    slotProps={{
                      primary: {variant: 'subtitle1'},
                      secondary: {color: 'text.secondary', variant: 'body2'},
                    }}
                  />
                  {openPermissions ? <ExpandLess color="action" /> : <ExpandMore color="action" />}
                </ListItemButton>

                <Collapse in={openPermissions} timeout="auto" unmountOnExit>
                  <List component="div" dense disablePadding>
                    {permissionsLabels.map((permission, index) => (
                      <ListItem key={index} divider sx={{pl: 6, pr: 2, py: 0.5, minHeight: 48}}>
                        <ListItemText
                          primary={`${permission}`}
                          slotProps={{
                            primary: {variant: 'body2', sx: {lineHeight: 1.3}},
                          }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Collapse>
              </>
            )}

            {constraintsLabels && constraintsLabels.length > 0 && (
              <>
                <ListItemButton onClick={handleConstraintsClick}>
                  <ListItemText
                    primary="Constraints"
                    secondary={openConstraints ? 'Click to collapse' : 'Click to expand'}
                    slotProps={{
                      primary: {variant: 'subtitle1'},
                      secondary: {color: 'text.secondary', variant: 'body2'},
                    }}
                  />
                  {openConstraints ? <ExpandLess color="action" /> : <ExpandMore color="action" />}
                </ListItemButton>

                <Collapse in={openConstraints} timeout="auto" unmountOnExit>
                  <List component="div" dense disablePadding>
                    {constraintsLabels.map((constraint, index) => (
                      <ListItem key={index} divider sx={{pl: 6, pr: 2, py: 0.5, minHeight: 48}}>
                        <ListItemText
                          primary={`${constraint}`}
                          slotProps={{
                            primary: {variant: 'body2', sx: {lineHeight: 1.3}},
                          }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Collapse>
              </>
            )}

            {responseURIsLabels.length > 0 && (
              <>
                <ListItemButton onClick={handleResponseURIsClick}>
                  <ListItemText
                    primary="Response URIs"
                    secondary={openResponseURIs ? 'Click to collapse' : 'Click to expand'}
                    slotProps={{
                      primary: {variant: 'subtitle1'},
                      secondary: {color: 'text.secondary', variant: 'body2'},
                    }}
                  />
                  {openResponseURIs ? <ExpandLess color="action" /> : <ExpandMore color="action" />}
                </ListItemButton>

                <Collapse in={openResponseURIs} timeout="auto" unmountOnExit>
                  <List component="div" dense disablePadding>
                    {responseURIsLabels.map((uri, index) => (
                      <ListItem key={index} divider sx={{pl: 6, pr: 2, py: 0.5, minHeight: 48}}>
                        <ListItemText
                          primary={`${uri}`}
                          slotProps={{
                            primary: {variant: 'body2', sx: {lineHeight: 1.3}},
                          }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Collapse>
              </>
            )}
            <ListItem divider>
              <ListItemText
                primary={expiryLabel || '-'}
                secondary="Expires at"
                slotProps={{
                  primary: {variant: 'subtitle1'},
                  secondary: {color: 'text.secondary', variant: 'body2'},
                }}
              />
            </ListItem>
          </List>
        </CardContent>
      </Card>
    </PageLayout>
  );
};

export default Consent;
