import React, {useState, useMemo} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {navigateGenericRequest, setExternalAction, setNavigationPath} from '../../../redux/reducers/navigation/navigation.actions';
import {EXTERNAL_ACTION, EXTERNAL_CHAIN_START, SCOPES, SELECT_LOGIN_ID} from '../../../utils/constants';
import {checkAndUpdateIdentities} from '../../../redux/reducers/identity/identity.actions';
import {SUPPORTED_CREDENTIALS, CREDENTIALS} from '../../../utils/constants';
import Button from '@mui/material/Button';
import {RequestCard} from "../../../containers/RequestCard/RequestCard";
import {VerusIdLogo} from "../../../images";
import {convertFqnToDisplayFormat} from "../../../utils/fullyqualifiedname";
import {isGenericRequest} from '../../../utils/genericRequest';
import store from '../../../redux/store';

interface ConsentProps {
  canProcessRequest: () => boolean;
  completeLoginConsent: () => Promise<void>;
}

const Consent: React.FC<ConsentProps> = (props) => {
  const {canProcessRequest, completeLoginConsent} = props;
  const dispatch = useDispatch();
  const [loading, setLoading] = useState<boolean>(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const deeplinkData = useSelector((state: any) => state.deeplink.data);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const deeplinkId = useSelector((state: any) => state.deeplink.id);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chainId = useSelector((state: any) => state.chainMetadata.chainId);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chainName = useSelector((state: any) => state.chainMetadata.chainName);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const signatureInfo = useSelector((state: any) => state.signatureInfo);

  const {sigBlockInfo, signedBy, signingRevocationIdentity, signingRecoveryIdentity} = signatureInfo;
  const {time} = sigBlockInfo;

  let signerFqn = "";
  let permissionsText = "";

  if (isGenericRequest(deeplinkId)) {
    signerFqn = signedBy;
    permissionsText = "Authenticate with VerusID";
  } else {
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
        // Manually add the dispatch and state since the Redux version is old.
        navigateGenericRequest()(dispatch, store.getState);
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
          systemId={deeplinkData.system_id}
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