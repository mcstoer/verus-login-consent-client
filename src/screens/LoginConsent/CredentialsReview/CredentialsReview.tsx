import {PlainLoginCredential, UnknownCredential} from '#/components/Credential';
import PageLayout from '#/components/PageLayout';
import {isLastDetail} from '#/features/details/detailNavigation';
import {
  extractCredentialsReviewDataV1,
  extractCredentialsReviewDataV2,
  selectUserDataCredentials,
} from '#/features/login/credentialsReviewDataExtractors';
import {useAppDispatch} from '#/redux/hooks';
import {
  navigateBackGenericRequest,
  navigateGenericRequest,
  setNavigationPath,
} from '#/redux/reducers/navigation/navigationSlice';
import {RootState} from '#/redux/store';
import {REDIRECT, SELECT_LOGIN_ID} from '#/utils/constants';
import {createAndSignLoginResponse} from '#/features/login/loginResponse';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import React, {useState} from 'react';
import {useSelector} from 'react-redux';
import {
  Credential,
  GenericRequest,
  IDENTITY_CREDENTIAL_PLAINLOGIN,
  LoginConsentRequest,
  VerusPayInvoice,
} from 'verus-typescript-primitives';

interface CredentialsReviewProps {
  setRequestResult: (response: unknown, callback: () => void) => void;
}

const CredentialsReview: React.FC<CredentialsReviewProps> = ({setRequestResult}) => {
  // TODO: The state isn't used consistently here to other UI. Figure out if that make sense.
  const dispatch = useAppDispatch();
  const state = useSelector((state: RootState) => state);
  const deeplinkData = state.deeplink.data;
  const chainId = state.chainMetadata.chainId;
  const [loading, setLoading] = useState(false);
  const activeIdentity = state.identity.activeIdentity;
  const currentDetailIndex = state.navigation.currentDetailIndex || 0;
  const appOrDelegatedIdentity = state.genericRequest.appOrDelegatedId.identity;

  // V1 for getting credentials
  let v1Credentials: Credential[] = [];
  if (state.credentials && state.credentials.credentials) {
    v1Credentials = state.credentials.credentials as Credential[];
  }

  // V2 for getting credentials
  const userDataCredentials = useSelector((state: RootState) =>
    selectUserDataCredentials(state, currentDetailIndex)
  );

  if (deeplinkData instanceof VerusPayInvoice) {
    throw new Error('Unable to handle a VerusPayInvoice for Credential Review');
  }

  const isGenericRequest = deeplinkData instanceof GenericRequest;

  const {signedBy} = state.signatureInfo;

  const {
    signerFqn,
    requestedCredentialKeys,
    missingCredentialKeys,
    missingCredentialLabels,
    credentials,
  } = isGenericRequest
    ? extractCredentialsReviewDataV2(
        deeplinkData,
        signedBy!,
        userDataCredentials,
        currentDetailIndex,
        appOrDelegatedIdentity
      )
    : extractCredentialsReviewDataV1(deeplinkData, signedBy!, v1Credentials);

  const cancel = () => {
    if (isGenericRequest) {
      dispatch(navigateBackGenericRequest());
    } else {
      dispatch(setNavigationPath(SELECT_LOGIN_ID));
    }
  };

  const isLastDetailInRequest =
    isGenericRequest && isLastDetail(deeplinkData as GenericRequest, currentDetailIndex);
  const continueButtonText = isLastDetailInRequest ? 'Finish' : 'Continue';
  const continueButtonColor = isLastDetailInRequest ? 'primary' : 'success';

  const continueLogin = async () => {
    if (isGenericRequest) {
      dispatch(navigateGenericRequest());
    } else {
      setLoading(true);
      const loginIdentity = activeIdentity.identity.identityaddress;
      const signedResponse = await createAndSignLoginResponse(
        chainId,
        deeplinkData as LoginConsentRequest,
        loginIdentity,
        credentials
      );

      setRequestResult(signedResponse, () => {
        dispatch(setNavigationPath(REDIRECT));
      });
    }
  };

  const renderCredentialComponent = (credential: Credential, index: number): React.JSX.Element => {
    const credentialId = `credential-${index}`;
    const credentialKey = credential.credentialKey;

    switch (credentialKey) {
      case IDENTITY_CREDENTIAL_PLAINLOGIN.vdxfid:
        return <PlainLoginCredential key={credentialId} credential={credential} />;
      default:
        return <UnknownCredential key={credentialId} credential={credential} />;
    }
  };

  return (
    <PageLayout
      title={'Review credentials to be sent to ' + signerFqn}
      loading={loading}
      footerContent={
        <>
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
            color={continueButtonColor}
            disabled={loading}
            onClick={() => continueLogin()}
            style={{
              width: 120,
              padding: 8,
            }}
          >
            {continueButtonText}
          </Button>
        </>
      }
    >
      <Card
        square
        sx={{
          marginTop: 1,
          marginBottom: 1,
          width: '100%',
          maxHeight: '100%',
          minHeight: 0,
          overflowY: 'auto',
          scrollbarGutter: 'stable',
        }}
      >
        <List disablePadding sx={{'& > *:last-child': {borderBottom: 'none'}}}>
          {credentials.length > 0 && (
            <>
              <List component="div">
                {credentials.map((credential, index) =>
                  renderCredentialComponent(credential, index)
                )}
              </List>
            </>
          )}

          {requestedCredentialKeys.length === 0 && (
            <ListItem>
              <ListItemText
                primary="No credentials requested by the application."
                disableTypography
              />
            </ListItem>
          )}

          {requestedCredentialKeys.length > 0 && credentials.length === 0 && (
            <ListItem>
              <ListItemText primary="No credentials available to include." disableTypography />
            </ListItem>
          )}
        </List>
      </Card>

      {missingCredentialKeys.length > 0 && (
        <Alert severity="warning" sx={{mt: 2, width: '90%', textAlign: 'left'}}>
          <AlertTitle>The following requested credentials were not found:</AlertTitle>
          {missingCredentialLabels.join(', ')}
        </Alert>
      )}
    </PageLayout>
  );
};

export default CredentialsReview;
