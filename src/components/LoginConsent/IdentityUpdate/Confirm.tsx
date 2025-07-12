import React, { useState } from 'react';
import Button from '@mui/material/Button';
import PageLayout from '../../common/PageLayout';

interface IdentityUpdateConfirmProps {
  completeLoginConsent: () => Promise<void>;
}

const IdentityUpdateConfirm: React.FC<IdentityUpdateConfirmProps> = (props) => {
  const { completeLoginConsent } = props;
  const [loading, setLoading] = useState<boolean>(false);

  const cancel = async (): Promise<void> => {
    setLoading(true);
    await completeLoginConsent();
  };

  return (
    <PageLayout
      title="Review the Identity Update Request"
      footerContent={
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
      }
    />
  );
};

export default IdentityUpdateConfirm;
