import React, {useState} from 'react';
import {useSelector} from 'react-redux';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PageLayout from '../../common/PageLayout';
import {GenericResponse, GenericRequest} from 'verus-typescript-primitives';

interface GenericFinalizationProps {
  completeLoginConsent: (params: {response: GenericResponse}) => Promise<void>;
}

const GenericFinalization: React.FC<GenericFinalizationProps> = (props) => {
  const {completeLoginConsent} = props;
  const [loading, setLoading] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const response: GenericResponse | null = useSelector((state: any) => state.genericResponse.response);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const request: GenericRequest = useSelector((state: any) => state.deeplink.data);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chainName: string = useSelector((state: any) => state.chainMetadata.chainName);

  const handleComplete = async () => {
    if (!response) {
      console.error('Cannot complete: no response available');
      return;
    }

    setLoading(true);

    try {
      await completeLoginConsent({response});
    } catch (error) {
      console.error('Error completing request:', error);
      setLoading(false);
    }
  };

  const detailsProcessed = response?.details?.length || 0;
  const totalDetails = request?.details?.length || 0;

  return (
    <PageLayout
      title="Request Complete"
      loading={loading}
      contentStyle={{
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center'
      }}
      footerContent={
        <div style={{display: 'flex', justifyContent: 'flex-end', width: '100%'}}>
          <Button
            variant="contained"
            disabled={loading}
            color="success"
            onClick={handleComplete}
            style={{
              width: 120,
              padding: 8,
            }}
          >
            {"Done"}
          </Button>
        </div>
      }
    >
      <Box style={{margin: 32}}>
        <CheckCircleIcon color="success" sx={{fontSize: 72}} />
      </Box>
      <Box style={{margin: 4}}>
        <Typography variant="h6">
          {`Successfully processed ${detailsProcessed} of ${totalDetails} request detail${totalDetails !== 1 ? 's' : ''}`}
        </Typography>
      </Box>
      <Box style={{margin: 4}} color="text.secondary">
        <Typography variant="body2">
          {`Chain: ${chainName || '???'}`}
        </Typography>
      </Box>
      <Box style={{margin: 8, marginTop: 16}}>
        <Typography variant="body2" color="text.secondary">
          The response will be returned to the requesting application.
        </Typography>
      </Box>
    </PageLayout>
  );
};

export default GenericFinalization;
