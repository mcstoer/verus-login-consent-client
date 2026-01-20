import React, {useState} from 'react';
import {useSelector} from 'react-redux';
import Button from '@mui/material/Button';
import {GenericRequest, LoginConsentRequest} from 'verus-typescript-primitives';

import {useAppDispatch} from '#/redux/hooks';
import {checkAndUpdateIdentities} from '#/redux/reducers/identity/identity.actions';
import {navigateGenericRequest, setExternalAction, setNavigationPath} from '#/redux/reducers/navigation/navigation.actions';
import {RootState} from '#/redux/store';
import {RequestCard} from '#/containers/RequestCard/RequestCard';
import {VerusIdLogo} from '#/images';
import {EXTERNAL_ACTION, EXTERNAL_CHAIN_START, SELECT_LOGIN_ID} from '#/utils/constants';
import {extractConsentDataV1, extractConsentDataV2} from '#/utils/login/consentDataExtractors';
import {Identity} from '#/redux/reducers/signatureInfo/signatureInfo.types';

interface ConsentProps {
  canProcessRequest: () => boolean;
  completeLoginConsent: () => Promise<void>;
}

const Consent: React.FC<ConsentProps> = (props) => {
  const {canProcessRequest, completeLoginConsent} = props;
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState<boolean>(false);
  const deeplinkData = useSelector((state: RootState) => state.deeplink.data);
  const currentDetailIndex = useSelector((state: RootState) => state.navigation.currentDetailIndex);
  const chainId = useSelector((state: RootState) => state.chainMetadata.chainId);
  const chainName = useSelector((state: RootState) => state.chainMetadata.chainName);
  const signatureInfo = useSelector((state: RootState) => state.signatureInfo);

  const {sigBlockInfo, signedBy, signingRevocationIdentity, signingRecoveryIdentity} = signatureInfo;
  const {time} = sigBlockInfo;

  const isGenericRequest = deeplinkData instanceof GenericRequest;

  const consentData = isGenericRequest
    ? extractConsentDataV2(deeplinkData, signedBy as Identity, currentDetailIndex)
    : extractConsentDataV1(deeplinkData as LoginConsentRequest, signedBy as Identity);

  const {signerFqn, permissionsText, systemId} = consentData;

  const tryLogin = async (): Promise<void> => {
    setLoading(true);

    const userActions = await checkAndUpdateIdentities(chainId);
    userActions.map(action => dispatch(action));

    if (canProcessRequest()) {
      if (isGenericRequest) {
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