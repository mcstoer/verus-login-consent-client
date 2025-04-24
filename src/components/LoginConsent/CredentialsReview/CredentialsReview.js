import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { setNavigationPath } from '../../../redux/reducers/navigation/navigation.actions';
import { REDIRECT, SELECT_LOGIN_ID } from '../../../utils/constants';
import { IDENTITY_CREDENTIAL_PLAINLOGIN } from 'verus-typescript-primitives';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import { VerusIdLogo } from "../../../images";
import { PlainLoginCredential, UnknownCredential } from './Credential';
import { convertFqnToDisplayFormat } from '../../../utils/fullyqualifiedname';
import IdentityInformation from '../../../containers/RequestCard/IdentityInformation';
import { createAndSignLoginResponse } from '../../../utils/loginResponse';

const CredentialsReview = (props) => {
  const { setRequestResult } = props;
  const dispatch = useDispatch();
  const { request } = useSelector((state) => state.rpc.loginConsentRequest);
  const [loading, setLoading] = useState(false);
  const activeIdentity = useSelector((state) => state.identity.activeIdentity);
  const credentials = useSelector((state) => {
    if (state.credentials && state.credentials.credentials) {
      return state.credentials.credentials;
    }
    return [];
  });

  const signerFqn = convertFqnToDisplayFormat(request.signedBy.fullyqualifiedname);

  const cancel = () => {
    dispatch(setNavigationPath(SELECT_LOGIN_ID));
  };

  const continueLogin = async () => {
    setLoading(true);
    const loginIdentity = activeIdentity.identity.identityaddress;
    const signedResponse = await createAndSignLoginResponse(
      request,
      loginIdentity,
      credentials
    );
    
    setRequestResult(signedResponse, () => {
      dispatch(setNavigationPath(REDIRECT));
    });
  };

  // Determines which credential component to render based on credential type.
  const renderCredentialComponent = (credential, index) => {
    const credentialId = `credential-${index}`;
    const credentialKey = credential.credentialKey;
    
    switch(credentialKey) {
    case IDENTITY_CREDENTIAL_PLAINLOGIN.vdxfid:
      return (
        <PlainLoginCredential 
          key={credentialId} 
          credential={credential} 
        />
      );
    default:
      return (
        <UnknownCredential
          key={credentialId}
          credential={credential}
        />
      );
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        height: "100%",
      }}
    >
      <div
        style={{
          height: "100%",
          display: "flex",
          padding: 32,
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <img src={VerusIdLogo} width={'55%'} height={'10%'}/>
        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: 16,
          }}
        >
          Review Included Credentials
        </div>

        <Card square sx={{
          marginTop: 1,
          marginBottom: 1,
          width: '100%',
          overflowY: 'scroll',
          maxHeight: '54vh',
        }}> 
          <List>
            <IdentityInformation
              label="Recipient"
              signedBy={request.signedBy}
              signerFqn={signerFqn}
              chainName={request.chainName}
              systemId={request.system_id}
              revocationIdentity={request.signingRevocationIdentity}
              recoveryIdentity={request.signingRecoveryIdentity}
            />
            {credentials.length > 0 ? (
              <>
                <ListItem>
                  <ListItemText primary="Credentials" disableTypography sx={{ fontWeight: 'bold', pr: 4 }}/>
                </ListItem>
                <List component="div" sx={{ pl: 2 }}>
                  {credentials.map((credential, index) => renderCredentialComponent(credential, index))}
                </List>
              </>
            ) : (
              <ListItem>
                <ListItemText 
                  primary="No credentials to include" 
                  disableTypography 
                />
              </ListItem>
            )}
          </List>
        </Card>

        <div
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "row",
            alignItems: "flex-end",
            justifyContent: "flex-end",
            marginTop: 'auto'
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
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
              {"Back"}
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
              {"Continue"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

CredentialsReview.propTypes = {
  setRequestResult: PropTypes.func.isRequired
};

export default CredentialsReview; 