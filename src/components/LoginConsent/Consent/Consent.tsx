import React, {useState, useMemo} from 'react';
import {useSelector} from 'react-redux';
import Button from '@mui/material/Button';
import {GenericRequest, LoginConsentRequest} from 'verus-typescript-primitives';

import {useAppDispatch} from '#/redux/hooks';
import {checkAndUpdateIdentities} from '#/redux/reducers/identity/identity.actions';
import {navigateGenericRequest, setExternalAction, setNavigationPath} from '#/redux/reducers/navigation/navigation.actions';
import {RootState} from '#/redux/store';
import {RequestCard} from '#/containers/RequestCard/RequestCard';
import {VerusIdLogo} from '#/images';
import {CREDENTIALS, EXTERNAL_ACTION, EXTERNAL_CHAIN_START, SCOPES, SELECT_LOGIN_ID, SUPPORTED_CREDENTIALS} from '#/utils/constants';
import {convertFqnToDisplayFormat} from '#/utils/fullyqualifiedname';
import {isGenericRequest} from '#/utils/genericRequest';

interface ConsentProps {
  canProcessRequest: () => boolean;
  completeLoginConsent: () => Promise<void>;
}

const Consent: React.FC<ConsentProps> = (props) => {
  const {canProcessRequest, completeLoginConsent} = props;
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState<boolean>(false);
  const deeplinkData = useSelector((state: RootState) => state.deeplink.data);
  const deeplinkId = useSelector((state: RootState) => state.deeplink.id);
  const chainId = useSelector((state: RootState) => state.chainMetadata.chainId);
  const chainName = useSelector((state: RootState) => state.chainMetadata.chainName);
  const signatureInfo = useSelector((state: RootState) => state.signatureInfo);

  const {sigBlockInfo, signedBy, signingRevocationIdentity, signingRecoveryIdentity} = signatureInfo;
  const {time} = sigBlockInfo;

  let signerFqn = "";
  let permissionsText = "";
  let systemId = "";

  if (deeplinkData instanceof GenericRequest) {
    signerFqn = signedBy.fullyqualifiedname;
    permissionsText = "Authenticate with VerusID";
    systemId = (deeplinkData as GenericRequest).signature?.systemID.toIAddress();
  } else if (deeplinkData instanceof LoginConsentRequest) {
    systemId = deeplinkData.system_id;
    // Convert the fully qualified name into a nicer format for VRSC.
    signerFqn = convertFqnToDisplayFormat(signedBy.fullyqualifiedname);

    permissionsText = useMemo(() => {
      const requestedPermissions = deeplinkData.challenge.requested_access;
      const permissionsDescriptions: string[] = [];

      if (requestedPermissions != null) {
        // Match permissions to the possible ids in the scopes.
        for (const permission of requestedPermissions) {
          if (SCOPES[permission.vdxfkey]) {
            permissionsDescriptions.push(SCOPES[permission.vdxfkey].description);
          } else if (SUPPORTED_CREDENTIALS.includes(permission.vdxfkey) && CREDENTIALS[permission.vdxfkey]) {
            permissionsDescriptions.push("Get " + CREDENTIALS[permission.vdxfkey].description + " credential");
          }
        }
      }

      return permissionsDescriptions.join(", ");
    }, [deeplinkData.challenge.requested_access]);
  }

  const tryLogin = async (): Promise<void> => {
    setLoading(true);

    const userActions = await checkAndUpdateIdentities(chainId);
    userActions.map(action => dispatch(action));

    if (canProcessRequest()) {
      if (isGenericRequest(deeplinkId)) {
        dispatch(navigateGenericRequest());
      } else {
        dispatch(setNavigationPath(SELECT_LOGIN_ID));
      }
    } else {
      dispatch(setExternalAction(EXTERNAL_CHAIN_START));
      dispatch(setNavigationPath(EXTERNAL_ACTION));
    }
  };

  const cancel = async (): Promise<void> => {
    setLoading(true);
    await completeLoginConsent();
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
            alignItems: "center",
            padding: 8,
            justifyContent: "center",
          }}
        >
          {signerFqn}{` is requesting login with VerusID`}
        </div>

        <RequestCard
          chainName={chainName}
          systemId={systemId}
          signedBy={signedBy}
          signerFqn={signerFqn}
          revocationIdentity={signingRevocationIdentity}
          recoveryIdentity={signingRecoveryIdentity}
          time={time}
          permissions={permissionsText}
          height={"54vh"}
        >
        </RequestCard>
        <div
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "row",
            alignItems: "flex-end",
            justifyContent: "flex-end",
            marginTop: "auto",
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
              {"Cancel"}
            </Button>
            <Button
              variant="contained"
              color="success"
              disabled={loading}
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

export default Consent;