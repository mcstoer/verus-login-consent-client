import ContentMultiMapRenderer from '#/components/ContentMultiMapRenderer';
import PageLayout from '#/components/PageLayout';
import {isLastDetail} from '#/features/details/detailNavigation';
import {useAppDispatch} from '#/redux/hooks';
import {
  navigateBackGenericRequest,
  navigateGenericRequest,
} from '#/redux/reducers/navigation/navigationSlice';
import {RootState} from '#/redux/store';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import React, {useState} from 'react';
import {useSelector} from 'react-redux';
import {GenericRequest, IdentityUpdateRequestOrdinalVDXFObject} from 'verus-typescript-primitives';

const IdentityUpdateContentMultiMap: React.FC = () => {
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState<boolean>(false);

  const deeplinkData = useSelector((state: RootState) => state.deeplink.data);
  const currentDetailIndex = useSelector((state: RootState) => state.navigation.currentDetailIndex);

  if (!(deeplinkData instanceof GenericRequest)) {
    throw new Error('Unable to handle identity updates outside of generic requests.');
  }

  const ordinal = deeplinkData.details[currentDetailIndex];

  if (!(ordinal instanceof IdentityUpdateRequestOrdinalVDXFObject)) {
    throw new Error('Unable to handle non-identity update detail.');
  }

  const deeplinkDetails = ordinal.data;
  const name = deeplinkDetails?.identity?.name || '';

  const contentMultiMapEntries = deeplinkDetails?.identity?.content_multimap?.kv_content
    ? Array.from(deeplinkDetails.identity.content_multimap.kv_content.entries())
    : [];

  const isLastDetailInRequest = isLastDetail(deeplinkData, currentDetailIndex);
  const continueButtonText = isLastDetailInRequest ? 'Finish' : 'Continue';
  const continueButtonColor = isLastDetailInRequest ? 'primary' : 'success';

  const handleNext = async (): Promise<void> => {
    setLoading(true);
    try {
      dispatch(navigateGenericRequest());
    } finally {
      setLoading(false);
    }
  };

  const cancel = async (): Promise<void> => {
    setLoading(true);
    try {
      dispatch(navigateBackGenericRequest());
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLayout
      title={`The following data will be added to the contentmultimap of your identity ${name}`}
      loading={loading}
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
            {'Back'}
          </Button>
          <Button
            variant="contained"
            disabled={loading}
            color={continueButtonColor}
            onClick={() => handleNext()}
            style={{
              width: 120,
              padding: 8,
            }}
          >
            {continueButtonText}
          </Button>
        </div>
      }
    >
      <Card
        square
        sx={{
          width: '100%',
          maxHeight: '60vh',
          overflowY: 'auto',
        }}
      >
        <CardContent>
          <ContentMultiMapRenderer contentMultiMapEntries={contentMultiMapEntries} />
        </CardContent>
      </Card>
    </PageLayout>
  );
};

export default IdentityUpdateContentMultiMap;
