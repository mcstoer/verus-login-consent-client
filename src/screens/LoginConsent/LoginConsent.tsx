import React from 'react';
import {connect} from 'react-redux';
import {GenericRequest, LoginConsentRequest} from 'verus-typescript-primitives';

import {getDetailMapEntry} from '#/features/details';
import {checkGenericRequest} from '#/features/genericRequest/genericRequest';
import {checkLoginConsentRequest} from '#/features/login/loginConsentRequest';
import {setChainMetadata} from '#/redux/reducers/chainMetadata/chainMetadata.actions';
import {DeeplinkData} from '#/redux/reducers/deeplink/deeplinkSlice';
import {setError} from '#/redux/reducers/error/error.actions';
import {setAppOrDelegatedId} from '#/redux/reducers/genericRequest/appOrDelegatedIdSlice';
import {
  checkAndUpdateAll,
  checkAndUpdateChainInfo,
} from '#/redux/reducers/identity/identity.actions';
import {
  setCurrentDetailIndex,
  setExternalAction,
  setNavigationPath,
} from '#/redux/reducers/navigation/navigationSlice';
import {setOriginApp} from '#/redux/reducers/origin/origin.actions';
import {completeRequest, CompleteRequestResult} from '#/redux/reducers/rpc/rpcSlice';
import {setSignatureInfo} from '#/redux/reducers/signatureInfo/signatureInfoSlice';
import store, {AppDispatch, RootState} from '#/redux/store';
import {getBlock} from '#/rpc/calls/getBlock';
import {getCurrency} from '#/rpc/calls/getCurrency';
import {getIdentity} from '#/rpc/calls/getIdentity';
import {getPlugin} from '#/rpc/calls/getPlugin';
import {getSignatureInfo} from '#/rpc/calls/getSignatureInfo';
import {
  API_GET_CHAIN_INFO,
  API_GET_IDENTITIES,
  CONSENT_TO_SCOPE,
  EXTERNAL_ACTION,
  EXTERNAL_CHAIN_START,
  VRSC_SYSTEM_ID,
  VRSCTEST_SYSTEM_ID,
} from '#/utils/constants';

import {LoginConsentRender} from './LoginConsent.render';
import {LoginConsentProps, LoginConsentState} from './types';

export class LoginConsent extends React.Component<LoginConsentProps, LoginConsentState> {
  constructor(props: LoginConsentProps) {
    super(props);

    this.state = {
      requestResult: null,
    };

    this.completeLoginConsent = this.completeLoginConsent.bind(this);
    this.getRequestResult = this.getRequestResult.bind(this);
    this.canProcessRequest = this.canProcessRequest.bind(this);
    this.handleRequest = this.handleRequest.bind(this);
    this.checkRequest = this.checkRequest.bind(this);
  }

  async componentDidUpdate(lastProps: LoginConsentProps): Promise<void> {
    if (
      lastProps !== this.props &&
      ((lastProps.rpcPassword !== this.props.rpcPassword && this.props.originAppId != null) ||
        (lastProps.originAppId !== this.props.originAppId && this.props.rpcPassword != null))
    ) {
      try {
        this.props.dispatch(
          setOriginApp(await getPlugin(this.props.originAppId, this.props.originAppBuiltin))
        );
      } catch (e) {
        this.props.dispatch(setError(e));
      }
    }

    if (lastProps !== this.props && lastProps.deeplinkData !== this.props.deeplinkData) {
      try {
        await this.handleRequest();
      } catch (e) {
        this.props.dispatch(setError(e));
      }
    }
  }

  async handleRequest(): Promise<void> {
    const request = this.props.deeplinkData;
    const mainChain = this.props.mainChain;

    // The main daemon must be running in order to check other chains.
    const chainActions = await checkAndUpdateChainInfo(mainChain);
    chainActions.map((action: unknown) => this.props.dispatch(action));

    // Add a small delay so that the Redux store is updated since
    // React 18 has concurrent rendering.
    await new Promise(resolve => setTimeout(resolve, 0));

    if (!this.canProcessRequest()) {
      this.props.dispatch(
        setChainMetadata({
          chainId: mainChain,
        })
      );
      this.props.dispatch(setExternalAction(EXTERNAL_CHAIN_START));
      this.props.dispatch(setNavigationPath(EXTERNAL_ACTION));
      return;
    }

    // The GenericRequest doesn't support a system ID to allow chains other than VRSC or VRSCTEST,
    // so use the flag to determine the chain.
    let systemId: string;
    if (request instanceof GenericRequest) {
      systemId = request.isTestnet() ? VRSCTEST_SYSTEM_ID : VRSC_SYSTEM_ID;
    } else {
      systemId = request.system_id;
    }

    const currencyInfo = await getCurrency(mainChain, systemId);
    const chainId = currencyInfo.name.toUpperCase();

    this.props.dispatch(
      setChainMetadata({
        chainName: currencyInfo.name,
        chainId: chainId,
      })
    );

    const actions = await checkAndUpdateAll(chainId);
    actions.map((action: unknown) => this.props.dispatch(action));

    if (this.canProcessRequest()) {
      await this.checkRequest(request);

      if (request instanceof LoginConsentRequest) {
        this.props.dispatch(setNavigationPath(CONSENT_TO_SCOPE));
      } else if (request instanceof GenericRequest) {
        if (request.details.length > 0) {
          // Initialize detail index to -1 to indicate no details have been processed yet.
          this.props.dispatch(setCurrentDetailIndex(-1));

          // Eagerly prep the first detail so Consent has its data (e.g. constraints).
          const firstDetail = request.details[0];
          const entry = getDetailMapEntry(firstDetail);
          await entry.prepFunction(
            firstDetail,
            0,
            this.props.dispatch as AppDispatch,
            store.getState
          );

          // CONSENT_TO_SCOPE acts as the review for the generic request.
          this.props.dispatch(setNavigationPath(CONSENT_TO_SCOPE));
        } else {
          throw new Error('GenericRequest contains no details to process');
        }
      } else {
        throw new Error(`Unsupported deeplink type for navigation`);
      }
    } else {
      this.props.dispatch(setExternalAction(EXTERNAL_CHAIN_START));
      this.props.dispatch(setNavigationPath(EXTERNAL_ACTION));
    }
  }

  private async fetchAndStoreSignatureInfo(
    chainId: string,
    systemId: string,
    signingId: string,
    signatureString: string
  ): Promise<void> {
    const signedBy = await getIdentity(chainId, signingId);

    const sigInfo = await getSignatureInfo(
      chainId,
      systemId,
      signatureString,
      signedBy.identity.identityaddress
    );
    const sigBlockInfo = await getBlock(chainId, sigInfo.height.toString());

    // Get the identities of the revocation and recovery i-addresses to display for anti-phishing.
    const [signingRevocationIdentity, signingRecoveryIdentity] = await Promise.all([
      getIdentity(chainId, signedBy.identity.revocationauthority),
      getIdentity(chainId, signedBy.identity.recoveryauthority),
    ]);

    this.props.dispatch(
      setSignatureInfo({
        signedBy,
        sigBlockInfo,
        signingRevocationIdentity,
        signingRecoveryIdentity,
      })
    );
  }

  // Checks request for signature authenticity, and other things that would immediately disqualify
  // it. If any problems are found, an error is thrown.
  async checkRequest(req: DeeplinkData): Promise<void> {
    try {
      const chainId = this.props.chainId;

      if (req instanceof LoginConsentRequest) {
        await checkLoginConsentRequest(chainId, req);
        await this.fetchAndStoreSignatureInfo(
          chainId,
          req.system_id,
          req.signing_id,
          req.signature.signature
        );
      } else if (req instanceof GenericRequest) {
        await checkGenericRequest(chainId, req, store.getState);
        if (req.isSigned()) {
          const signingId = req.signature.identityID.toIAddress();
          const signatureString = req.signature.signatureAsVch.toString('base64');
          const systemId = req.isTestnet() ? VRSCTEST_SYSTEM_ID : VRSC_SYSTEM_ID;

          await this.fetchAndStoreSignatureInfo(chainId, systemId, signingId, signatureString);

          if (req.hasAppOrDelegatedID()) {
            const appOrDelegatedIdentity = await getIdentity(
              chainId,
              req.appOrDelegatedID.toIAddress()
            );
            this.props.dispatch(setAppOrDelegatedId(appOrDelegatedIdentity));
          }
        }
      } else {
        throw new Error(`Unsupported deeplink type`);
      }
    } catch (e) {
      console.error(e);
      this.props.dispatch(setError(e));
    }
  }

  getRequestResult(res: unknown, cb: () => void): void {
    this.setState(
      {
        requestResult: res,
      },
      () => cb()
    );
  }

  canProcessRequest(): boolean {
    return (
      this.props.apiErrors[API_GET_CHAIN_INFO] === null &&
      this.props.apiErrors[API_GET_IDENTITIES] === null &&
      this.props.chainInfo != null &&
      this.props.chainInfo.longestchain !== 0 &&
      this.props.chainInfo.longestchain === this.props.chainInfo.blocks
    );
  }

  async completeLoginConsent(result?: CompleteRequestResult, error?: Error): Promise<void> {
    this.props.dispatch(completeRequest(result, error));
  }

  render() {
    return LoginConsentRender.call(this);
  }
}

const mapStateToProps = (state: RootState): Omit<LoginConsentProps, 'dispatch'> => {
  return {
    path: state.navigation.path,
    pathArray: state.navigation.pathArray,
    port: state.rpc.port,
    originAppId: state.origin.originAppId,
    originApp: state.origin.originApp,
    originAppBuiltin: state.origin.originAppBuiltin,
    error: state.error.error,
    rpcPassword: state.rpc.password,
    windowId: state.rpc.windowId,
    deeplinkData: state.deeplink.data,
    deeplinkId: state.deeplink.id,
    chainInfo: state.identity.chainInfo,
    apiErrors: state.error.apiErrors,
    chainId: state.chainMetadata.chainId,
    chainName: state.chainMetadata.chainName,
    mainChain: state.chainMetadata.mainChain,
    signatureInfo: state.signatureInfo,
  };
};

export default connect(mapStateToProps)(LoginConsent);
