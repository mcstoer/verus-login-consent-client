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

const LIST_ITEM_SLOTS = {
  standard: {
    primary: {variant: 'subtitle1' as const},
    secondary: {color: 'text.secondary' as const, variant: 'body2' as const},
  },
  nested: {
    primary: {variant: 'body2' as const, sx: {lineHeight: 1.3}},
  },
  collapsible: {
    primary: {variant: 'subtitle1' as const},
    secondary: {color: 'text.secondary' as const, variant: 'body2' as const},
  },
} as const;

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

  // Since the index is -1 when we have not processed any details, the detail index
  // may be -1 even though we refer to the 0 index detail for authentication info.
  const consentData = isGenericRequest
    ? extractConsentDataV2(deeplinkData, signedBy as Identity, Math.max(0, currentDetailIndex))
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
          overflowY: 'auto',
        }}
      >
        <CardContent sx={{p: 0}}>
          <List disablePadding sx={{'& > *:last-child': {borderBottom: 'none'}}}>
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
                slotProps={LIST_ITEM_SLOTS.standard}
              />
            </ListItem>

            <ListItem divider>
              <ListItemText
                primary={time ? unixToDate(time) : '-'}
                secondary="Signed on"
                slotProps={LIST_ITEM_SLOTS.standard}
              />
            </ListItem>

            {permissionsLabels && permissionsLabels.length > 0 && (
              <>
                <ListItemButton onClick={handlePermissionsClick}>
                  <ListItemText
                    primary="Permissions Requested"
                    secondary={openPermissions ? 'Click to collapse' : 'Click to expand'}
                    slotProps={LIST_ITEM_SLOTS.collapsible}
                  />
                  {openPermissions ? <ExpandLess color="action" /> : <ExpandMore color="action" />}
                </ListItemButton>

                <Collapse in={openPermissions} timeout="auto" unmountOnExit>
                  <List component="div" dense disablePadding>
                    {permissionsLabels.map((permission, index) => (
                      <ListItem key={index} divider sx={{pl: 6, pr: 2, py: 0.5, minHeight: 48}}>
                        <ListItemText
                          primary={`${permission}`}
                          slotProps={LIST_ITEM_SLOTS.nested}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Collapse>
              </>
            )}

            {constraintsLabels && constraintsLabels.length > 0 && (
              <>
                <ListItemButton divider onClick={handleConstraintsClick}>
                  <ListItemText
                    primary="Constraints"
                    secondary={openConstraints ? 'Click to collapse' : 'Click to expand'}
                    slotProps={LIST_ITEM_SLOTS.collapsible}
                  />
                  {openConstraints ? <ExpandLess color="action" /> : <ExpandMore color="action" />}
                </ListItemButton>

                <Collapse in={openConstraints} timeout="auto" unmountOnExit>
                  <List component="div" dense disablePadding>
                    {constraintsLabels.map((constraint, index) => (
                      <ListItem key={index} divider sx={{pl: 6, pr: 2, py: 0.5, minHeight: 48}}>
                        <ListItemText
                          primary={`${constraint}`}
                          slotProps={LIST_ITEM_SLOTS.nested}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Collapse>
              </>
            )}

            {responseURIsLabels.length > 0 && (
              <>
                <ListItemButton divider onClick={handleResponseURIsClick}>
                  <ListItemText
                    primary="Response URIs"
                    secondary={openResponseURIs ? 'Click to collapse' : 'Click to expand'}
                    slotProps={LIST_ITEM_SLOTS.collapsible}
                  />
                  {openResponseURIs ? <ExpandLess color="action" /> : <ExpandMore color="action" />}
                </ListItemButton>

                <Collapse in={openResponseURIs} timeout="auto" unmountOnExit>
                  <List component="div" dense disablePadding>
                    {responseURIsLabels.map((uri, index) => (
                      <ListItem key={index} divider sx={{pl: 6, pr: 2, py: 0.5, minHeight: 48}}>
                        <ListItemText primary={`${uri}`} slotProps={LIST_ITEM_SLOTS.nested} />
                      </ListItem>
                    ))}
                  </List>
                </Collapse>
              </>
            )}
            {expiryLabel && (
              <>
                <ListItem divider>
                  <ListItemText
                    primary={expiryLabel || '-'}
                    secondary="Expires at"
                    slotProps={LIST_ITEM_SLOTS.standard}
                  />
                </ListItem>
              </>
            )}
          </List>
        </CardContent>
      </Card>
    </PageLayout>
  );
};

export default Consent;
