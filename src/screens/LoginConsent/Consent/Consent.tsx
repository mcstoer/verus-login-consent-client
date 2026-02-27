import React, {useState} from 'react';
import {useSelector} from 'react-redux';

import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';

import {GenericRequest, LoginConsentRequest} from 'verus-typescript-primitives';

import CollapsibleListSection from '#/components/CollapsibleListSection';
import IdentityDetails from '#/components/Identity';
import NestedListItem from '#/components/NestedListItem';
import PageLayout from '#/components/PageLayout';
import {LIST_ITEM_SLOTS} from '#/components/listItemSlots';
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
          maxHeight: '100%',
          minHeight: 0,
          overflowY: 'auto',
          scrollbarGutter: 'stable',
        }}
      >
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
            <CollapsibleListSection title="Permissions Requested">
              {permissionsLabels.map((permission, index) => (
                <NestedListItem key={index} primary={`${permission}`} />
              ))}
            </CollapsibleListSection>
          )}

          {constraintsLabels && constraintsLabels.length > 0 && (
            <CollapsibleListSection title="Constraints" divider>
              {constraintsLabels.map((constraint, index) => (
                <NestedListItem key={index} primary={`${constraint}`} />
              ))}
            </CollapsibleListSection>
          )}

          {responseURIsLabels.length > 0 && (
            <CollapsibleListSection title="Response URIs" divider>
              {responseURIsLabels.map((uri, index) => (
                <NestedListItem key={index} primary={`${uri}`} />
              ))}
            </CollapsibleListSection>
          )}

          {expiryLabel && (
            <ListItem>
              <ListItemText
                primary={expiryLabel || '-'}
                secondary="Expires at"
                slotProps={LIST_ITEM_SLOTS.standard}
              />
            </ListItem>
          )}
        </List>
      </Card>
    </PageLayout>
  );
};

export default Consent;
