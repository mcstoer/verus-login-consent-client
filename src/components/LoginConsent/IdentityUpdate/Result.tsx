import React, { useState } from 'react';
import Button from '@mui/material/Button';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PageLayout from '../../common/PageLayout';

interface IdentityUpdateResultProps {
  completeLoginConsent: () => Promise<void>;
}

const IdentityUpdateResult: React.FC<IdentityUpdateResultProps> = (props) => {
  const { completeLoginConsent } = props;
  const [loading, setLoading] = useState<boolean>(false);

  const handleDone = async (): Promise<void> => {
    setLoading(true);
    await completeLoginConsent();
  };

  return (
    <PageLayout
      title="Identity Update Complete"
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
      <div style={{ fontWeight: "bold", marginBottom: 16 }}>{"Success!"}</div>
      <div style={{ margin: 16 }}>
        <CheckCircleIcon color="success" sx={{ fontSize: 72 }} />
      </div>
      <div style={{ marginTop: 16 }}>
        {"Identity update has been completed successfully."}
      </div>
    </PageLayout>
  );
};

export default IdentityUpdateResult;
