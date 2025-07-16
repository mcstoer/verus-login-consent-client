import React, { useState, useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import PageLayout from '../../common/PageLayout';
import { setNavigationPath } from '../../../redux/reducers/navigation/navigation.actions';
import { IDENTITY_UPDATE_CONFIRM, IDENTITY_UPDATE_CONTENTMULTIMAP } from '../../../utils/constants';
import { IdentityUpdateRequest, IdentityUpdateRequestDetails } from 'verus-typescript-primitives';
import { getIdentity } from '../../../rpc/calls/getIdentity';
import { SnackbarAlert } from '../../../containers/SnackbarAlert';

interface IdentityUpdateCoreProps {
  completeLoginConsent: () => Promise<void>;
}

const IdentityUpdateCore: React.FC<IdentityUpdateCoreProps> = () => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState<boolean>(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [identity, setIdentity] = useState<any>(null);
  const [fetchError, setFetchError] = useState({
    showError: false,
    description: ''
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const deeplinkData: IdentityUpdateRequest = useSelector((state: any) => state.deeplink.data);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chainId: string = useSelector((state: any) => state.chainMetadata.chainId);
  // Explicity set the type to IdentityUpdateRequestDetails since otherwise it is IdentityUpdateResponseDetails.
  const deeplinkDetails = deeplinkData.details as IdentityUpdateRequestDetails;
  const name = deeplinkDetails.identity.name;

  const fetchIdentity = useCallback(async () => {
    try {
      const identity = await getIdentity(chainId, name);
      return identity;
    } catch (error) {
      console.error('Failed to fetch identity:', error);
      throw error;
    }
  }, [chainId, name]);

  // Fetch identity when component loads
  useEffect(() => {
    
    const loadIdentity = async () => {
      if (!chainId || !name) return;
      setLoading(true);
      try {
        const identityData = await fetchIdentity();
        setIdentity(identityData);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load identity';
        setFetchError({
          showError: true,
          description: errorMessage
        });
      } finally {
        setLoading(false);
      }
    };

    loadIdentity();
    
  }, [fetchIdentity, chainId, name]);

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
      title={`Review identity updates to ${name}`}
      footerContent={
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
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
      {loading ? (
        <Box sx={{ 
          display: 'flex', 
          flex: 1, 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}>
          <CircularProgress />
        </Box>
      ) : (
        // TODO
        <Box sx={{ flex: 1 }}>
          <p>TODO: Add content here.</p>
        </Box>
      )}
      <SnackbarAlert
        open={fetchError.showError}
        text={fetchError.description}
        handleClose={() => setFetchError({ showError: false, description: '' })}
      />
    </PageLayout>
  );
};

export default IdentityUpdateCore;
