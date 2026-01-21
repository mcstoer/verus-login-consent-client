import React, {useState} from 'react';
import {useSelector} from 'react-redux';

import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import {SelectChangeEvent} from '@mui/material/Select';

import {GenericRequest, LoginConsentRequest} from 'verus-typescript-primitives';

import {checkAndUpdateIdentities, setActiveVerusId} from '#/redux/reducers/identity/identity.actions';
import {setCredentials} from '#/redux/reducers/credentials/credentials.actions';
import {setError} from '#/redux/reducers/error/error.actions';
import {navigateBackGenericRequest, navigateGenericRequest, setExternalAction, setNavigationPath} from '#/redux/reducers/navigation/navigation.actions';
import {useAppDispatch} from '#/redux/hooks';
import {RootState} from '#/redux/store';
import {VerusIdLogo} from '#/images';
import {getCredentialsByScope} from '#/rpc/calls/getCredentials';
import {CONSENT_TO_SCOPE, CREDENTIALS_REVIEW, EXTERNAL_ACTION, EXTERNAL_CHAIN_START, PROVISIONING_FORM, REDIRECT} from '#/utils/constants';
import {createAndSignLoginResponse} from '#/utils/loginResponse';
import {isGenericRequest} from '#/utils/genericRequest';
import {extractLoginDataV1, extractLoginDataV2, LoginData} from '#/utils/login/loginDataExtractors';
import {Identity} from '#/redux/reducers/signatureInfo/signatureInfo.types';

interface LoginProps {
  canProcessRequest: () => boolean;
  setRequestResult: (result: unknown, callback: () => void) => void;
}

const Login = (props: LoginProps) => {
  const {canProcessRequest, setRequestResult} = props;
  const dispatch = useAppDispatch();
  const chainId = useSelector((state: RootState) => state.chainMetadata.chainId);
  const signatureInfo = useSelector((state: RootState) => state.signatureInfo);
  const [loading, setLoading] = useState<boolean>(false);
  const identities = useSelector((state: RootState) => state.identity.identities) as Identity[];
  const activeIdentity = useSelector((state: RootState) => state.identity.activeIdentity) as Identity;
  const deeplinkData = useSelector((state: RootState) => state.deeplink.data);
  const deeplinkId = useSelector((state: RootState) => state.deeplink.id);
  const currentDetailIndex = useSelector((state: RootState) => state.navigation.currentDetailIndex) || 0;

  const loginData: LoginData = deeplinkData instanceof GenericRequest
    ? extractLoginDataV2(deeplinkData, identities, currentDetailIndex)
    : extractLoginDataV1(deeplinkData as LoginConsentRequest, identities);

  const {
    requestedDataKeys = [],
    hasRequestedCredentials = false,
    canProvision,
    filterIdentities
  } = loginData;

  const filteredIdentities = filterIdentities(identities);

  const [includeCredentials, setIncludeCredentials] = useState(hasRequestedCredentials);

  const cancel = (): void => {
    if (isGenericRequest(deeplinkId)) {
      dispatch(navigateBackGenericRequest());
    } else {
      dispatch(setNavigationPath(CONSENT_TO_SCOPE));
    }
  };

  const tryLogin = async (): Promise<void> => {
    setLoading(true);

    const userActions = await checkAndUpdateIdentities(chainId);
    userActions.map(action => dispatch(action));

    if (canProcessRequest()) {
      if (isGenericRequest(deeplinkId)) {
        dispatch(navigateGenericRequest());
      } else {
        const loginIdentity = activeIdentity.identity.identityaddress;

        try {
          if (includeCredentials && hasRequestedCredentials) {
          // Get the associated credentials based on the signing id.
            let credentials: unknown[] = [];
            try {
              credentials = await getCredentialsByScope(
                chainId,
                loginIdentity,
              signatureInfo.signedBy!.identity.identityaddress,
              requestedDataKeys // Pass the requested credentials
              );
            } catch (e) {
            // Ignore the error if it means that there are no credentials to be fetched.
              if (e instanceof Error && !e.message.includes("No z-address found for identity")) {
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
      }
    } else {
      dispatch(setExternalAction(EXTERNAL_CHAIN_START));
      dispatch(setNavigationPath(EXTERNAL_ACTION));
    }
  };

  const tryProvision = (): void => {
    dispatch(setNavigationPath(PROVISIONING_FORM));
  };

  const selectId = (address: string): void => {
    dispatch(
      setActiveVerusId(
        address.length == 0
          ? null
          : filteredIdentities.find((x: Identity) => address === x.identity.identityaddress)
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
          <FormControl style={{maxWidth: 560, flex: 1}}>
            <Select
              value={
                activeIdentity == null
                  ? ""
                  : activeIdentity.identity.identityaddress
              }
              displayEmpty
              inputProps={{'aria-label': 'Select a VerusID'}}
              style={{
                textAlign: "start",
                paddingTop: 2,
              }}
              onChange={(e: SelectChangeEvent<string>) => {
                return selectId(e.target.value);
              }}
            >
              <MenuItem value="">
                <em>Select a VerusID</em>
              </MenuItem>
              {filteredIdentities.map((id: Identity, index: number) => {
                return (
                  <MenuItem
                    key={index}
                    value={id.identity.identityaddress}
                  >{`${id.identity.name}@`}</MenuItem>
                );
              })}
            </Select>
            <div style={{display: 'flex', justifyContent: 'center'}}>
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
                  style={{marginTop: 8}}
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