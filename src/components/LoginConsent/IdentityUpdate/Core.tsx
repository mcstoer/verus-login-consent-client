import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Collapse from '@mui/material/Collapse';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import PageLayout from '../../common/PageLayout';
import { setNavigationPath } from '../../../redux/reducers/navigation/navigation.actions';
import { IDENTITY_UPDATE_CONFIRM, IDENTITY_UPDATE_CONTENTMULTIMAP } from '../../../utils/constants';
import { IdentityUpdateRequest, IdentityUpdateRequestDetails } from 'verus-typescript-primitives';
import { getIdentity } from '../../../rpc/calls/getIdentity';
import { SnackbarAlert } from '../../../containers/SnackbarAlert';
import { convertFqnToDisplayFormat } from '../../../utils/fullyqualifiedname';
import { createIdentityDescriptor } from '../../../utils/identity';
import { setActiveVerusId } from '../../../redux/reducers/identity/identity.actions';

interface IdentityFieldChange {
  field: string;
  newValue: string;
  oldValue: string;
}

const processIdentityChanges = async (
  request: IdentityUpdateRequest,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  identity: any,
  chainId: string
): Promise<IdentityFieldChange[]> => {
  const changes: IdentityFieldChange[] = [];

  if (!request?.details || !identity?.identity) {
    return changes;
  }

  const requestDetails = request.details as IdentityUpdateRequestDetails;
  const identityChanges = requestDetails.identity;
  const currentIdentity = identity.identity;

  if (!identityChanges) {
    return changes;
  }

  if (identityChanges.primary_addresses?.length > 0) {
    const newPrimaryAddresses = identityChanges.primary_addresses.map(addr => addr.toAddress()).sort().join('\n');
    const oldPrimaryAddresses = currentIdentity.primaryaddresses ? currentIdentity.primaryaddresses.slice().sort().join('\n') : '';

    if (newPrimaryAddresses !== oldPrimaryAddresses) {
      changes.push({
        field: 'Primary Addresses',
        newValue: newPrimaryAddresses,
        oldValue: oldPrimaryAddresses
      });
    }
  }

  if (identityChanges.min_sigs) {
    const newMinSigs = identityChanges.min_sigs.toString();
    const oldMinSigs = currentIdentity.minimumsignatures ? currentIdentity.minimumsignatures.toString() : '';

    if (newMinSigs !== oldMinSigs) {
      changes.push({
        field: 'Minimum Signatures',
        newValue: newMinSigs,
        oldValue: oldMinSigs
      });
    }
  }

  if (identityChanges.revocation_authority) {
    if (identityChanges.revocation_authority.toAddress() !== currentIdentity.revocationauthority) {
      let newRevocationAuthorityDisplay = identityChanges.revocation_authority.toAddress();
      try {
        const newRevocationIdentity = await getIdentity(chainId, identityChanges.revocation_authority.toAddress());
        if (newRevocationIdentity?.identity?.name) {
          const fqn = newRevocationIdentity.fullyqualifiedname ? convertFqnToDisplayFormat(newRevocationIdentity.fullyqualifiedname) : '';
          newRevocationAuthorityDisplay = createIdentityDescriptor(newRevocationIdentity, fqn);
        }
      } catch (error) {
        console.warn('Could not get the name of the new revocation identity:', error);
      }

      let oldRevocationAuthorityDisplay = currentIdentity.revocationauthority || '';
      if (currentIdentity.revocationauthority) {
        try {
          const oldRevocationIdentity = await getIdentity(chainId, currentIdentity.revocationauthority);
          if (oldRevocationIdentity?.identity?.name) {
            const fqn = oldRevocationIdentity.fullyqualifiedname ? convertFqnToDisplayFormat(oldRevocationIdentity.fullyqualifiedname) : '';
            oldRevocationAuthorityDisplay = createIdentityDescriptor(oldRevocationIdentity, fqn);
          }
        } catch (error) {
          console.warn('Could not get the name of the old revocation identity:', error);
        }
      }

      changes.push({
        field: 'Revocation Authority',
        newValue: newRevocationAuthorityDisplay,
        oldValue: oldRevocationAuthorityDisplay
      });
    }
  }

  if (identityChanges.recovery_authority) {
    if (identityChanges.recovery_authority.toAddress() !== currentIdentity.recoveryauthority) {
      let newRecoveryAuthorityDisplay = identityChanges.recovery_authority.toAddress();
      try {
        const newRecoveryIdentity = await getIdentity(chainId, identityChanges.recovery_authority.toAddress());
        if (newRecoveryIdentity?.identity?.name) {
          const fqn = newRecoveryIdentity.fullyqualifiedname ? convertFqnToDisplayFormat(newRecoveryIdentity.fullyqualifiedname) : '';
          newRecoveryAuthorityDisplay = createIdentityDescriptor(newRecoveryIdentity, fqn);
        }
      } catch (error) {
        console.warn('Could not get the name of the new recovery identity:', error);
      }

      let oldRecoveryAuthorityDisplay = currentIdentity.recoveryauthority || '';
      if (currentIdentity.recoveryauthority) {
        try {
          const oldRecoveryIdentity = await getIdentity(chainId, currentIdentity.recoveryauthority);
          if (oldRecoveryIdentity?.identity?.name) {
            const fqn = oldRecoveryIdentity.fullyqualifiedname ? convertFqnToDisplayFormat(oldRecoveryIdentity.fullyqualifiedname) : '';
            oldRecoveryAuthorityDisplay = createIdentityDescriptor(oldRecoveryIdentity, fqn);
          }
        } catch (error) {
          console.warn('Could not get the name of the old recovery identity:', error);
        }
      }

      changes.push({
        field: 'Recovery Authority',
        newValue: newRecoveryAuthorityDisplay,
        oldValue: oldRecoveryAuthorityDisplay
      });
    }
  }

  if (identityChanges.private_addresses?.length > 0) {
    const newPrivateAddresses = identityChanges.private_addresses.map(addr => addr.toAddressString()).join('\n');
    const oldPrivateAddresses = currentIdentity.privateaddress || '';

    if (newPrivateAddresses !== oldPrivateAddresses) {
      changes.push({
        field: 'Private Addresses',
        newValue: newPrivateAddresses,
        oldValue: oldPrivateAddresses
      });
    }
  }

  if (identityChanges.unlock_after != null) {
    const newTimelock = identityChanges.unlock_after.toString();
    const oldTimelock = currentIdentity.timelock != null ? currentIdentity.timelock.toString() : '';

    if (newTimelock !== oldTimelock) {
      changes.push({
        field: 'Timelock',
        newValue: newTimelock,
        oldValue: oldTimelock
      });
    }
  }

  return changes;
};

const IdentityUpdateCore: React.FC = () => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState<boolean>(false);
  const [changes, setChanges] = useState<IdentityFieldChange[]>([]);
  const [openDropdowns, setOpenDropdowns] = useState<{ [key: number]: boolean }>({});
  const [fetchError, setFetchError] = useState({
    showError: false,
    description: ''
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const request: IdentityUpdateRequest = useSelector((state: any) => state.deeplink.data);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const deeplinkData: IdentityUpdateRequest = useSelector((state: any) => state.deeplink.data);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chainId: string = useSelector((state: any) => state.chainMetadata.chainId);
  // Explicity set the type to IdentityUpdateRequestDetails since otherwise it is IdentityUpdateResponseDetails.
  const deeplinkDetails = deeplinkData.details as IdentityUpdateRequestDetails;
  const name = deeplinkDetails.identity.name;

  const handleDropdownToggle = (index: number) => {
    setOpenDropdowns(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  useEffect(() => {
    const loadIdentityAndComputeChanges = async () => {
      if (!request) {
        setChanges([]);
        return;
      }

      setLoading(true);
      try {
        const identityData = await getIdentity(chainId, name);
        dispatch(setActiveVerusId(identityData));
        const currentChanges = await processIdentityChanges(request, identityData, chainId);
        setChanges(currentChanges);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load identity';
        setFetchError({
          showError: true,
          description: errorMessage
        });
        setChanges([]);
      } finally {
        setLoading(false);
      }
    };

    loadIdentityAndComputeChanges();
  }, [deeplinkData]);

  const handleNext = async (): Promise<void> => {
    setLoading(true);
    try {
      dispatch(setNavigationPath(IDENTITY_UPDATE_CONTENTMULTIMAP));
    } finally {
      setLoading(false);
    }
  };

  const cancel = async (): Promise<void> => {
    setLoading(true);
    try {
      dispatch(setNavigationPath(IDENTITY_UPDATE_CONFIRM));
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLayout
      title={`The following fields other than the contentmultimap, will be updated in your identity ${name}`}
      loading={loading}
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
        <CardContent>
          {changes.length === 0 ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 4,
                textAlign: 'center'
              }}
            >
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No fields to update
              </Typography>
            </Box>
          ) : (
            <List>
              {changes.map((change, index) => (
                <React.Fragment key={index}>
                  <ListItem dense sx={{ pb: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {change.field}
                      </Typography>
                    </Box>
                  </ListItem>

                  <ListItemButton
                    divider
                    dense
                    onClick={() => handleDropdownToggle(index)}
                  >
                    <ListItemText
                      primary="New value"
                      secondary={change.newValue}
                      slotProps={{
                        primary: { variant: 'body2', color: 'text.secondary' },
                        secondary: {
                          variant: 'body1',
                          color: 'text.primary',
                          sx: {
                            wordBreak: 'break-all',
                            userSelect: 'text',
                            cursor: 'text',
                            whiteSpace: 'pre-line'
                          },
                          // Allows the user to select the text without opening the dropdown.
                          onMouseDown: (e) => e.stopPropagation(),
                          onMouseUp: (e) => e.stopPropagation(),
                          onClick: (e) => e.stopPropagation()
                        }
                      }}
                    />
                    {openDropdowns[index] ? <ExpandLess color="action" /> : <ExpandMore color="action" />}
                  </ListItemButton>

                  <Collapse in={openDropdowns[index]} timeout="auto" unmountOnExit>
                    <List component="div" dense disablePadding>
                      <ListItem divider dense sx={{ pr: 2 }}>
                        <ListItemText
                          primary="Previous value"
                          secondary={change.oldValue}
                          slotProps={{
                            primary: { variant: 'body2', color: 'text.secondary' },
                            secondary: {
                              variant: 'body1',
                              color: 'text.primary',
                              sx: {
                                wordBreak: 'break-all',
                                whiteSpace: 'pre-line'
                              }
                            }
                          }}
                        />
                      </ListItem>
                    </List>
                  </Collapse>
                </React.Fragment>
              ))}
            </List>
          )}
        </CardContent>
      </Card>
      <SnackbarAlert
        open={fetchError.showError}
        text={fetchError.description}
        handleClose={() => setFetchError({ showError: false, description: '' })}
      />
    </PageLayout>
  );
};

export default IdentityUpdateCore;
