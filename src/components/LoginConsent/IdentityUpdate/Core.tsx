import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import Button from '@mui/material/Button';
import PageLayout from '../../common/PageLayout';
import { setNavigationPath } from '../../../redux/reducers/navigation/navigation.actions';
import { IDENTITY_UPDATE_CONFIRM, IDENTITY_UPDATE_CONTENTMULTIMAP } from '../../../utils/constants';

interface IdentityUpdateCoreProps {
  completeLoginConsent: () => Promise<void>;
}

const IdentityUpdateCore: React.FC<IdentityUpdateCoreProps> = (props) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState<boolean>(false);


  const handleNext = async (): Promise<void> => {
    setLoading(true);
    dispatch(setNavigationPath(IDENTITY_UPDATE_CONTENTMULTIMAP));
  };

  const cancel = async (): Promise<void> => {
    setLoading(true);
    dispatch(setNavigationPath(IDENTITY_UPDATE_CONFIRM));
  };

  return (
    <PageLayout
      title="Identity Update Core"
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
    />
  );
};

export default IdentityUpdateCore;
