import React, {useState} from 'react';
import {useSelector} from 'react-redux';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import {GenericRequest, IdentityUpdateRequestOrdinalVDXFObject} from 'verus-typescript-primitives';

import ContentMultiMapRenderer from '#/components/ContentMultiMapRenderer';
import PageLayout from '#/components/PageLayout';
import {isLastDetail} from '#/features/details/detailNavigation';
import {useAppDispatch} from '#/redux/hooks';
import {setError} from '#/redux/reducers/error/error.actions';
import {
  navigateBackGenericRequest,
  navigateGenericRequest,
} from '#/redux/reducers/navigation/navigationSlice';
import {RootState} from '#/redux/store';

const IdentityUpdateContentMultiMap: React.FC = () => {
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState<boolean>(false);

  const deeplinkData = useSelector((state: RootState) => state.deeplink.data);
  const currentDetailIndex = useSelector((state: RootState) => state.navigation.currentDetailIndex);

  if (!(deeplinkData instanceof GenericRequest)) {
    const err = new Error('Unable to handle identity updates outside of generic requests.');
    dispatch(setError(err));
    return;
  }

  const ordinal = deeplinkData.details[currentDetailIndex];

  if (!(ordinal instanceof IdentityUpdateRequestOrdinalVDXFObject)) {
    const err = new Error('Unable to handle non-identity update detail.');
    dispatch(setError(err));
    return;
  }

  const deeplinkDetails = ordinal.data;
  const name = deeplinkDetails?.identity?.name || '';

  const contentMultiMapEntries = deeplinkDetails?.identity?.content_multimap?.kvContent
    ? Array.from(deeplinkDetails.identity.content_multimap.kvContent.entries())
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
      title={`Review content additions to ${name}`}
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
          maxHeight: '100%',
          minHeight: 0,
          overflowY: 'auto',
          scrollbarGutter: 'stable',
        }}
      >
        <Box
          sx={{
            '& > ul:last-child, & > div:last-child': {borderBottom: 'none'},
            '& ul > div:last-child li': {borderBottom: 'none'},
          }}
        >
          <ContentMultiMapRenderer contentMultiMapEntries={contentMultiMapEntries} />
        </Box>
      </Card>
    </PageLayout>
  );
};

export default IdentityUpdateContentMultiMap;
