import React, {useState} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {
  IDENTITY_CREDENTIAL_PLAINLOGIN,
  LoginConsentRequest,
  Credential,
} from 'verus-typescript-primitives';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import {PlainLoginCredential, UnknownCredential} from '#/components/Credential';
import PageLayout from '#/components/PageLayout';
import {createAndSignLoginResponse} from '#/utils/loginResponse';
import {convertFqnToDisplayFormat} from '#/utils/fullyqualifiedname';
import {setNavigationPath} from '#/redux/reducers/navigation/navigationSlice';
import {RootState} from '#/redux/store';
import {REDIRECT, SELECT_LOGIN_ID, SUPPORTED_CREDENTIALS, CREDENTIALS} from '#/utils/constants';

interface CredentialsReviewProps {
  setRequestResult: (response: unknown, callback: () => void) => void;
}

const CredentialsReview: React.FC<CredentialsReviewProps> = ({setRequestResult}) => {
  const dispatch = useDispatch();
  const deeplinkData = useSelector(
    (state: RootState) => state.deeplink.data
  ) as LoginConsentRequest;
  const chainId = useSelector((state: RootState) => state.chainMetadata.chainId);
  const [loading, setLoading] = useState(false);
  const activeIdentity = useSelector((state: RootState) => state.identity.activeIdentity);
  const credentials = useSelector((state: RootState) => {
    if (state.credentials && state.credentials.credentials) {
      return state.credentials.credentials as Credential[];
    }
    return [];
  });

  const signatureInfo = useSelector((state: RootState) => state.signatureInfo);
  const {signedBy} = signatureInfo;
  const signerFqn = convertFqnToDisplayFormat(signedBy!.fullyqualifiedname);

  const requestedCredentialKeys = deeplinkData.challenge.requested_access
    .filter(item => SUPPORTED_CREDENTIALS.includes(item.vdxfkey))
    .map(item => item.vdxfkey);

  const fetchedCredentialKeys = credentials.map(credential => credential.credentialKey);

  const missingCredentialKeys = requestedCredentialKeys.filter(
    key => !fetchedCredentialKeys.includes(key)
  );

  const cancel = () => {
    dispatch(setNavigationPath(SELECT_LOGIN_ID));
  };

  const continueLogin = async () => {
    setLoading(true);
    const loginIdentity = activeIdentity.identity.identityaddress;
    const signedResponse = await createAndSignLoginResponse(
      chainId,
      deeplinkData,
      loginIdentity,
      credentials
    );

    setRequestResult(signedResponse, () => {
      dispatch(setNavigationPath(REDIRECT));
    });
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
            color="primary"
            disabled={loading}
            onClick={() => continueLogin()}
            style={{
              width: 120,
              padding: 8,
            }}
          >
            {'Continue'}
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
          overflowY: 'scroll',
          maxHeight: '54vh',
        }}
      >
        <List>
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
          {missingCredentialKeys
            .map(key => (CREDENTIALS[key] ? CREDENTIALS[key].description : key))
            .join(', ')}
        </Alert>
      )}
    </PageLayout>
  );
};

export default CredentialsReview;
