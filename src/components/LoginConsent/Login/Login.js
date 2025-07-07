import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setExternalAction, setNavigationPath } from '../../../redux/reducers/navigation/navigation.actions';
import {
  CONSENT_TO_SCOPE,
  EXTERNAL_ACTION,
  EXTERNAL_CHAIN_START,
  REDIRECT,
  PROVISIONING_FORM,
  CREDENTIALS_REVIEW,
  SUPPORTED_CREDENTIALS
} from '../../../utils/constants';
import { checkAndUpdateIdentities, setActiveVerusId } from '../../../redux/reducers/identity/identity.actions';
import { setError } from '../../../redux/reducers/error/error.actions';
import { 
  ID_ADDRESS_VDXF_KEY,
  LOGIN_CONSENT_ID_PROVISIONING_WEBHOOK_VDXF_KEY,
} from 'verus-typescript-primitives';
import { getCredentialsByScope } from '../../../rpc/calls/getCredentials';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import { VerusIdLogo } from "../../../images";
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import { setCredentials } from '../../../redux/reducers/credentials/credentials.actions';
import { createAndSignLoginResponse } from '../../../utils/loginResponse';

const Login = (props) => {
  // eslint-disable-next-line react/prop-types
  const { canLoginOrGiveConsent, setRequestResult } = props;
  const dispatch = useDispatch();
  const chainId = useSelector((state) => state.chainMetadata.chainId);
  const signatureInfo = useSelector((state) => state.signatureInfo);
  const previousPath = useSelector((state) => state.navigation.previousPath);
  const [loading, setLoading] = useState(false);
  const identities = useSelector((state) => state.identity.identities);
  const activeIdentity = useSelector((state) => state.identity.activeIdentity);
  const deeplinkData = useSelector((state) => state.deeplink.data);
  
  // Check if there are any credentials requested
  const requestedCredentialKeys = deeplinkData.challenge.requested_access
    .filter(item => SUPPORTED_CREDENTIALS.includes(item.vdxfkey))
    .map(item => item.vdxfkey);
  
  const hasRequestedCredentials = requestedCredentialKeys.length > 0;
  
  // Only enable the checkbox if credentials are requested
  const [includeCredentials, setIncludeCredentials] = useState(hasRequestedCredentials);

  // The provisioning webhook needs to exist for provisioning.
  let canProvision = deeplinkData.challenge.provisioning_info && deeplinkData.challenge.provisioning_info.some(x => {
    return (
      x.vdxfkey === LOGIN_CONSENT_ID_PROVISIONING_WEBHOOK_VDXF_KEY.vdxfid
    );
  });

  // Provisioning is not an option if the subject is specified to be one of the identities that the user owns.
  if (identities.length > 0) {
    const identitySubjects =
      deeplinkData.challenge.subject.filter(item => item.vdxfkey === ID_ADDRESS_VDXF_KEY.vdxfid).map(id => id.data);

    const identitySubjectMatches = identities.filter(id => identitySubjects.includes(id.identity.identityaddress));

    if (identitySubjectMatches.length > 0) {
      canProvision = false;
    }
  }

  const cancel = () => {
    dispatch(setNavigationPath(previousPath || CONSENT_TO_SCOPE));
  };

  const tryLogin = async() => {
    setLoading(true);

    const userActions = await checkAndUpdateIdentities(chainId);
    userActions.map(action => dispatch(action));

    if (canLoginOrGiveConsent()) {
      const loginIdentity = activeIdentity.identity.identityaddress;

      try {
        if (includeCredentials && hasRequestedCredentials) {
          // Get the associated credentials based on the signing id.
          let credentials = [];
          try {
            credentials = await getCredentialsByScope(
              chainId,
              loginIdentity,
              signatureInfo.signedBy.identity.identityaddress,
              requestedCredentialKeys // Pass the requested credentials
            );
          } catch (e) {
            // Ignore the error if it means that there are no credentials to be fetched.
            if (!e.message.includes("No z-address found for identity")) {
              throw e;
            }
          } 
          
          dispatch(setCredentials(credentials));
          
          setLoading(false);
          dispatch(setNavigationPath(CREDENTIALS_REVIEW));
        } else {
          const signedResponse = await createAndSignLoginResponse(
            chainId,
            deeplinkData,
            loginIdentity,
            []
          );
          
          setRequestResult(signedResponse, () => {
            dispatch(setNavigationPath(REDIRECT));
          });
        }
      } catch(e) {
        setLoading(false);
        dispatch(setError(e));
      }
    } else {
      dispatch(setExternalAction(EXTERNAL_CHAIN_START));
      dispatch(setNavigationPath(EXTERNAL_ACTION));
    }
  };

  const tryProvision = () => {
    dispatch(setNavigationPath(PROVISIONING_FORM));
  };

  const selectId = (address) => {
    dispatch(
      setActiveVerusId(
        address.length == 0
          ? null
          : identities.find((x) => address === x.identity.identityaddress)
      )
    );
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
            justifyContent: "flex-start",
          }}
        >
          <div
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              flexDirection: "row",
              padding: 8,
            }}
          >
            {`Select an Identity` +
              (canProvision ? " or Request an Identity" : "")}
          </div>
        </div>
        <div
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "row",
            alignItems: "flex-start",
            justifyContent: "center",
            flex: 1,
            paddingTop: 2,
          }}
        >
          <FormControl style={{ maxWidth: 560, flex: 1 }}>
            <Select
              value={
                activeIdentity == null
                  ? ""
                  : activeIdentity.identity.identityaddress
              }
              displayEmpty
              inputProps={{ "aria-label": "Select a VerusID" }}
              style={{
                textAlign: "start",
                paddingTop: 2,
              }}
              onChange={(e) => {
                return selectId(e.target.value);
              }}
            >
              <MenuItem value="">
                <em>Select a VerusID</em>
              </MenuItem>
              {identities.map((id, index) => {
                return (
                  <MenuItem
                    key={index}
                    value={id.identity.identityaddress}
                  >{`${id.identity.name}@`}</MenuItem>
                );
              })}
            </Select>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              {hasRequestedCredentials && (
                <FormControlLabel
                  control={
                    <Checkbox 
                      checked={includeCredentials}
                      onChange={(e) => setIncludeCredentials(e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Include Credentials"
                  style={{ marginTop: 8 }}
                />
              )}
            </div>
          </FormControl>
        </div>
        <div
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column-reverse",
            alignItems: "center",
            justifyContent: "flex-end",
            flex: 1,
          }}
        >
          {canProvision && <Button
            variant="contained"
            color="primary"
            disabled={loading}
            onClick={() => tryProvision()}
            style={{
              width: 240,
              padding: 8,
            }}
          >
            {"Request a new VerusID"}
          </Button>}
        </div>
        <div
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "row",
            alignItems: "flex-end",
            justifyContent: "flex-end",
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
              disabled={loading || activeIdentity == null}
              onClick={() => tryLogin()}
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

export default Login;