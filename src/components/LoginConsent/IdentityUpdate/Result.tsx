import React, { useState } from 'react';
import Button from '@mui/material/Button';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Box from '@mui/material/Box';
import PageLayout from '../../common/PageLayout';
import { useSelector } from 'react-redux';

interface IdentityUpdateResultProps {
  completeLoginConsent: () => Promise<void>;
}

const IdentityUpdateResult: React.FC<IdentityUpdateResultProps> = (props) => {
  const { completeLoginConsent } = props;
  const [loading, setLoading] = useState<boolean>(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chainName: string = useSelector((state: any) => state.chainMetadata.chainName);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const txid: string = useSelector((state: any) => state.identityUpdate.txid);

  const handleDone = async (): Promise<void> => {
    setLoading(true);
    await completeLoginConsent();
  };

  return (
    <PageLayout
      title="Identity updated!"
      loading={loading}
      contentStyle={{
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center'
      }}
      footerContent={
        <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
          <Button
            variant="contained"
            disabled={loading}
            color="success"
            onClick={() => handleDone()}
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
      <Box style={{ margin: 32 }}>
        <CheckCircleIcon color="success" sx={{ fontSize: 72 }} />
      </Box>
      <Box style={{ margin: 4 }}>
        {`Your VerusID has been updated on the ${chainName || '???'} blockchain.`}
      </Box>
      <Box style={{ margin: 4 }} color="text.secondary">
        {'This action may take a few minutes to confirm on-chain.'}
      </Box>
      <Box style={{ margin: 8 }}>
        {`Transaction ID: ${txid}`}
      </Box>
    </PageLayout>
  );
};

export default IdentityUpdateResult;
