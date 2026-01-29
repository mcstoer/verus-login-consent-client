import React, {useState} from 'react';
import {useSelector} from 'react-redux';

import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import MenuItem from '@mui/material/MenuItem';
import Select, {SelectChangeEvent} from '@mui/material/Select';

import {GenericRequest, LoginConsentRequest} from 'verus-typescript-primitives';

import PageLayout from '#/components/PageLayout';
import {useAppDispatch} from '#/redux/hooks';
import {setCredentials} from '#/redux/reducers/credentials/credentials.actions';
import {setError} from '#/redux/reducers/error/error.actions';
import {
  checkAndUpdateIdentities,
  setActiveVerusId,
} from '#/redux/reducers/identity/identity.actions';
import {
  navigateBackGenericRequest,
  navigateGenericRequest,
  setExternalAction,
  setNavigationPath,
} from '#/redux/reducers/navigation/navigationSlice';
import {Identity} from '#/redux/reducers/signatureInfo/signatureInfo.types';
import {RootState} from '#/redux/store';
import {getCredentialsByScope} from '#/rpc/calls/getCredentials';
import {
  CONSENT_TO_SCOPE,
  CREDENTIALS_REVIEW,
  EXTERNAL_ACTION,
  EXTERNAL_CHAIN_START,
  PROVISIONING_FORM,
  REDIRECT,
} from '#/utils/constants';
import {isLastDetail} from '#/features/details/detailNavigation';
import {extractLoginDataV1, extractLoginDataV2, LoginData} from '#/utils/login/loginDataExtractors';
import {createAndSignLoginResponse} from '#/utils/loginResponse';

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
  const activeIdentity = useSelector(
    (state: RootState) => state.identity.activeIdentity
  ) as Identity;
  const deeplinkData = useSelector((state: RootState) => state.deeplink.data);
  const currentDetailIndex =
    useSelector((state: RootState) => state.navigation.currentDetailIndex) || 0;

  const isGenericRequest = deeplinkData instanceof GenericRequest;

  const loginData: LoginData = isGenericRequest
    ? extractLoginDataV2(deeplinkData, identities, currentDetailIndex)
    : extractLoginDataV1(deeplinkData as LoginConsentRequest, identities);

  const {
    requestedDataKeys = [],
    hasRequestedCredentials = false,
    canProvision,
    filterIdentities,
  } = loginData;

  const filteredIdentities = filterIdentities(identities);

  const [includeCredentials, setIncludeCredentials] = useState(hasRequestedCredentials);

  const isLastDetailInRequest =
    isGenericRequest && isLastDetail(deeplinkData as GenericRequest, currentDetailIndex);
  const continueButtonText = isLastDetailInRequest ? 'Finish' : 'Continue';
  const continueButtonColor = isLastDetailInRequest ? 'primary' : 'success';

  const cancel = (): void => {
    if (isGenericRequest) {
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
      if (isGenericRequest) {
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
              if (e instanceof Error && !e.message.includes('No z-address found for identity')) {
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
        } catch (e) {
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
    <PageLayout
      title={`Select an Identity` + (canProvision ? ' or Request an Identity' : '')}
      loading={loading}
      contentStyle={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
      }}
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
            disabled={loading || activeIdentity == null}
            onClick={() => tryLogin()}
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
      <FormControl style={{maxWidth: 560, width: '100%'}}>
        <Select
          value={activeIdentity == null ? '' : activeIdentity.identity.identityaddress}
          displayEmpty
          inputProps={{'aria-label': 'Select a VerusID'}}
          style={{
            textAlign: 'start',
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
                  onChange={e => setIncludeCredentials(e.target.checked)}
                  color="primary"
                />
              }
              label="Include Credentials"
              style={{marginTop: 8}}
            />
          )}
        </div>
      </FormControl>
      {canProvision && (
        <Button
          variant="contained"
          color="primary"
          disabled={loading}
          onClick={() => tryProvision()}
          style={{
            width: 240,
            padding: 8,
            marginTop: 'auto',
          }}
        >
          {'Request a new VerusID'}
        </Button>
      )}
    </PageLayout>
  );
};

export default Login;
