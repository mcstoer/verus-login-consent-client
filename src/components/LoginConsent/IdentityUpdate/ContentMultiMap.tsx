import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import Button from '@mui/material/Button';
import PageLayout from '../../common/PageLayout';
import { setNavigationPath } from '../../../redux/reducers/navigation/navigation.actions';
import { IDENTITY_UPDATE_CORE, IDENTITY_UPDATE_RESULT } from '../../../utils/constants';

interface IdentityUpdateContentMultiMapProps {
  completeLoginConsent: () => Promise<void>;
}

const IdentityUpdateContentMultiMap: React.FC<IdentityUpdateContentMultiMapProps> = (props) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState<boolean>(false);

  const handleFinish = async (): Promise<void> => {
    setLoading(true);
    dispatch(setNavigationPath(IDENTITY_UPDATE_RESULT));
  };

  const cancel = async (): Promise<void> => {
    setLoading(true);
    dispatch(setNavigationPath(IDENTITY_UPDATE_CORE));
  };

  return (
    <PageLayout
      title="Identity Update ContentMultiMap"
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
            onClick={() => handleFinish()}
            style={{
              width: 120,
              padding: 8,
            }}
          >
            {"Finish"}
          </Button>
        </div>
      }
    />
  );
};

export default IdentityUpdateContentMultiMap;
