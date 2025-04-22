import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setExternalAction, setNavigationPath } from '../../../redux/reducers/navigation/navigation.actions';
import {
  CONSENT_TO_SCOPE,
  EXTERNAL_ACTION,
  EXTERNAL_CHAIN_START,
  REDIRECT,
  PROVISIONING_FORM
} from '../../../utils/constants';
import { checkAndUpdateIdentities, setActiveVerusId } from '../../../redux/reducers/identity/identity.actions';
import { signResponse } from '../../../rpc/calls/signResponse';
import { setError } from '../../../redux/reducers/error/error.actions';
import { 
  ID_ADDRESS_VDXF_KEY,
  LOGIN_CONSENT_ID_PROVISIONING_WEBHOOK_VDXF_KEY,
  LoginConsentDecision, LoginConsentResponse
} from 'verus-typescript-primitives';
import BigNumber from 'bignumber.js';
import { getCredentialsByScope } from '../../../rpc/calls/getCredentials';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import { VerusIdLogo } from "../../../images";
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';

const Login = (props) => {
  // eslint-disable-next-line react/prop-types
  const { canLoginOrGiveConsent, setRequestResult } = props;
  const dispatch = useDispatch();
  const { request } = useSelector((state) => state.rpc.loginConsentRequest);
  const [loading, setLoading] = useState(false);
  const identities = useSelector((state) => state.identity.identities);
  const activeIdentity = useSelector((state) => state.identity.activeIdentity);
  const [includeCredentials, setIncludeCredentials] = useState(true);

  // See if the webhook exists.
  let canProvision = request.challenge.provisioning_info && request.challenge.provisioning_info.some(x => {
    return (
      x.vdxfkey === LOGIN_CONSENT_ID_PROVISIONING_WEBHOOK_VDXF_KEY.vdxfid
    );
  });

  // Provisioning is not an option if the subject is specified to be one of the identities that the user owns.
  if (identities.length > 0) {
    const identitySubjects =
      request.challenge.subject.filter(item => item.vdxfkey === ID_ADDRESS_VDXF_KEY.vdxfid).map(id => id.data);

    const identitySubjectMatches = identities.filter(id => identitySubjects.includes(id.identity.identityaddress));

    if (identitySubjectMatches.length > 0) {
      canProvision = false;
    }
  }

  const cancel = () => {
    dispatch(setNavigationPath(CONSENT_TO_SCOPE));
  };

  const tryLogin = async() => {
    setLoading(true);

    const userActions = await checkAndUpdateIdentities(request.chainTicker);
    userActions.map(action => dispatch(action));

    if (canLoginOrGiveConsent()) {
      const loginIdentity = activeIdentity.identity.identityaddress;

      try {
        let credentials = [];
        if (includeCredentials) {
          // Get the associated credentials based on the signing id.
          credentials = await getCredentialsByScope(
            request.chainTicker,
            loginIdentity,
            request.signedBy.identity.identityaddress
          );
        }

        let response = new LoginConsentResponse({
          system_id: request.system_id,
          signing_id: loginIdentity,
          decision: new LoginConsentDecision({
            decision_id: request.challenge.challenge_id,
            request: request,
            created_at: BigNumber(Date.now())
              .dividedBy(1000)
              .decimalPlaces(0)
              .toNumber(),
            credentials: credentials,
          })
        });

        response.chainTicker = request.chainTicker;
        
        const sigRes = await signResponse(response);
        
        setRequestResult(sigRes, () => {
          dispatch(setNavigationPath(REDIRECT));
        });
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