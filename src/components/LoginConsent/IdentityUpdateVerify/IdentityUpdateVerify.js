import React, { useState } from 'react';
import Button from '@mui/material/Button';
import PageLayout from '../../common/PageLayout';

const IdentityUpdateVerify = (props) => {
  // eslint-disable-next-line react/prop-types
  const { completeLoginConsent } = props;
  const [loading, setLoading] = useState(false);

  const cancel = async () => {
    setLoading(true);
    await completeLoginConsent();
  };

  return (
    <PageLayout
      title="Verify Identity Update Request"
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

export default IdentityUpdateVerify;
