import PropTypes from 'prop-types';
import React from 'react';
import {connect} from 'react-redux';
import {LoginConsentRequest, LOGIN_CONSENT_REQUEST_VDXF_KEY, GENERIC_REQUEST_DEEPLINK_VDXF_KEY, GenericRequest, GenericResponse} from 'verus-typescript-primitives';
import {setChainMetadata} from '../../redux/reducers/chainMetadata/chainMetadata.actions';
import {setError} from '../../redux/reducers/error/error.actions';
import {checkAndUpdateAll, checkAndUpdateChainInfo} from '../../redux/reducers/identity/identity.actions';
import {setExternalAction, setNavigationPath} from '../../redux/reducers/navigation/navigation.actions';
import {setOriginApp} from '../../redux/reducers/origin/origin.actions';
import {setSignatureInfo} from '../../redux/reducers/signatureInfo/signatureInfo.actions';
import {setGenericResponse} from '../../redux/reducers/genericResponse/genericResponse.actions';
import {closePlugin} from '../../rpc/calls/closePlugin';
import {getBlock} from '../../rpc/calls/getBlock';
import {getCurrency} from '../../rpc/calls/getCurrency';
import {getIdentity} from '../../rpc/calls/getIdentity';
import {getPlugin} from '../../rpc/calls/getPlugin';
import {getSignatureInfo} from '../../rpc/calls/getSignatureInfo';
import {getStartPathForDetail, runDetailPrepFunction} from '../../utils/detailNavigation';
import {
  API_GET_CHAIN_INFO,
  API_GET_IDENTITIES,
  EXTERNAL_ACTION,
  EXTERNAL_CHAIN_START,
  CONSENT_TO_SCOPE,
  VERUS_LOGIN_CONSENT_UI,
} from "../../utils/constants";
import {checkGenericRequest} from '../../utils/genericRequest';
import {checkLoginConsentRequest} from '../../utils/loginConsentRequest';
import {LoginConsentRender} from './LoginConsent.render';

class LoginConsent extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      requestResult: null
    };

    this.completeLoginConsent = this.completeLoginConsent.bind(this);
    this.getRequestResult = this.getRequestResult.bind(this);
    this.canProcessRequest = this.canProcessRequest.bind(this);
    this.handleRequest = this.handleRequest.bind(this);
    this.checkRequest = this.checkRequest.bind(this);
  }

  async componentDidUpdate(lastProps) {
    if (
      lastProps !== this.props &&
      ((lastProps.rpcPassword !== this.props.rpcPassword &&
        this.props.originAppId != null) ||
        (lastProps.originAppId !== this.props.originAppId &&
          this.props.rpcPassword != null))
    ) {
      try {
        this.props.dispatch(
          setOriginApp(
            await getPlugin(this.props.originAppId, this.props.originAppBuiltin)
          )
        );
      } catch (e) {
        this.props.dispatch(setError(e));
      }
    }

    if (
      lastProps !== this.props &&
      lastProps.deeplinkData !== this.props.deeplinkData
    ) {
      await this.handleRequest();
    }
  }

  async handleRequest() {
    const request = this.props.deeplinkData;
    const mainChain = this.props.mainChain;

    // Check if the main daemon is running.
    const chainActions = await checkAndUpdateChainInfo(mainChain);
    chainActions.map((action) => this.props.dispatch(action));

    // Add a small delay so that the Redux store is updated since
    // React 18 has concurrent rendering.
    await new Promise(resolve => setTimeout(resolve, 0));

    if (!this.canProcessRequest()) {
      this.props.dispatch(setChainMetadata({
        chainId: mainChain
      }));
      this.props.dispatch(setExternalAction(EXTERNAL_CHAIN_START));
      this.props.dispatch(setNavigationPath(EXTERNAL_ACTION));
      return;
    }

    // Get information on the system of the request.
    const currencyInfo = await getCurrency(mainChain, request.system_id);
    const chainId = currencyInfo.name.toUpperCase();

    // Store chain metadata in dedicated reducer
    this.props.dispatch(setChainMetadata({
      chainName: currencyInfo.name,
      chainId: chainId,
    }));

    const actions = await checkAndUpdateAll(chainId);
    actions.map((action) => this.props.dispatch(action));

    if (this.canProcessRequest()) {
      await this.checkRequest(this.props.deeplinkId, request);

      switch (this.props.deeplinkId) {
      case LOGIN_CONSENT_REQUEST_VDXF_KEY.vdxfid:
        this.props.dispatch(setNavigationPath(CONSENT_TO_SCOPE));
        break;

      case GENERIC_REQUEST_DEEPLINK_VDXF_KEY.vdxfid: {
        const genericRequest = new GenericRequest(request);
        const response = new GenericResponse({
          requestID: genericRequest.requestID,
          requestHash: genericRequest.getRawDataSha256(),
          details: [],
        });

        this.props.dispatch(setGenericResponse(response));

        console.log("Created the generic response");

        // Initialize detail processing - navigate to first detail
        if (genericRequest.details.length > 0) {
          const firstDetail = genericRequest.details[0];

          // Run prep function for the first detail (if any)
          await runDetailPrepFunction(firstDetail, this.props.dispatch);

          // Navigate to the first screen of the first detail
          const startPath = getStartPathForDetail(firstDetail);
          this.props.dispatch(setNavigationPath(startPath));
        } else {
          throw new Error('GenericRequest contains no details to process');
        }

        break;
      }

      default:
        throw new Error(`Unsupported deeplink type for navigation: ${this.props.deeplinkId}`);
      }
    } else {
      this.props.dispatch(setExternalAction(EXTERNAL_CHAIN_START));
      this.props.dispatch(setNavigationPath(EXTERNAL_ACTION));
    }
  }

  // Checks request for signature authenticity, and other things that would immediately disqualify
  // it. If any problems are found, an error is thrown.
  async checkRequest(deeplinkId, req) {
    try {
      const chainId = this.props.chainId;
      let request;
      let signingId;
      let signatureString;

      // Switch on the deeplink type to determine how to handle the request
      switch (deeplinkId) {
      case LOGIN_CONSENT_REQUEST_VDXF_KEY.vdxfid: {
        request = new LoginConsentRequest(req);
        await checkLoginConsentRequest(chainId, request);
        signingId = request.signing_id;
        signatureString = request.signature.signature;

        const signedBy = await getIdentity(chainId, signingId);

        // Get information on the signature for displaying later.
        const sigInfo = await getSignatureInfo(chainId, signingId, signatureString, signedBy.identity.identityaddress);
        const sigBlockInfo = await getBlock(chainId, sigInfo.height.toString());

        // Get the identities of the revocation and recovery i-addresses to display for anti-phishing.
        const signingRevocationIdentity  = await getIdentity(chainId, signedBy.identity.revocationauthority);
        const signingRecoveryIdentity = await getIdentity(chainId, signedBy.identity.recoveryauthority);

        // Store signature information in dedicated reducer
        this.props.dispatch(setSignatureInfo({
          signedBy: signedBy,
          sigBlockInfo: sigBlockInfo,
          signingRevocationIdentity: signingRevocationIdentity,
          signingRecoveryIdentity: signingRecoveryIdentity
        }));
        break;
      }

      case GENERIC_REQUEST_DEEPLINK_VDXF_KEY.vdxfid:
        request = new GenericRequest(req);
        await checkGenericRequest(chainId, request);
        if (request.isSigned) {
          signingId = request.signature.identityID.toIAddress();
          signatureString = request.signature.signatureAsVch.toString('hex');
          // TODO: Remove the placeholders when the signature verification works.
          // Store signature information in dedicated reducer
          const signedBy = await getIdentity(chainId, signingId);
          const sigBlockInfo = await getBlock(chainId, '884624');
          const signingRevocationIdentity  = await getIdentity(chainId, signingId);
          const signingRecoveryIdentity = await getIdentity(chainId, signingId);

          console.log(signedBy, sigBlockInfo, signingRevocationIdentity, signingRecoveryIdentity);

          this.props.dispatch(setSignatureInfo({
            signedBy: signedBy,
            sigBlockInfo: sigBlockInfo,
            signingRevocationIdentity: signingRevocationIdentity,
            signingRecoveryIdentity: signingRecoveryIdentity
          }));
        }
        break;

      default:
        throw new Error(`Unsupported deeplink type: ${deeplinkId}`);
      }
    } catch(e) {
      console.error(e);
      this.props.dispatch(setError(new Error(e.message)));
    }
  }

  getRequestResult(res, cb) {
    this.setState({
      requestResult: res
    }, () => cb());
  }

  canProcessRequest() {
    return (
      this.props.apiErrors[API_GET_CHAIN_INFO] === null &&
      this.props.apiErrors[API_GET_IDENTITIES] === null &&
      this.props.chainInfo != null &&
      this.props.chainInfo.longestchain !== 0 &&
      this.props.chainInfo.longestchain === this.props.chainInfo.blocks
    );
  }

  async completeLoginConsent(result = null, error = null) {
    try {
      await closePlugin(
        VERUS_LOGIN_CONSENT_UI,
        this.props.windowId,
        true,
        result != null
          ? result
          : {error: error != null ? error.message : error}
      );
    } catch(e) {
      this.props.dispatch(setError(e));
    }
  }

  render() {
    return LoginConsentRender.call(this);
  }
}

LoginConsent.propTypes = {
  dispatch: PropTypes.func.isRequired,
  path: PropTypes.string,
  pathArray: PropTypes.array,
  port: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  originAppId: PropTypes.string,
  originApp: PropTypes.object,
  originAppBuiltin: PropTypes.bool,
  error: PropTypes.object,
  rpcPassword: PropTypes.string,
  windowId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  deeplinkData: PropTypes.object,
  deeplinkId: PropTypes.string,
  chainInfo: PropTypes.object,
  apiErrors: PropTypes.object,
  chainId: PropTypes.string,
  chainName: PropTypes.string,
  mainChain: PropTypes.string,
  signatureInfo: PropTypes.object
};

const mapStateToProps = (state) => {
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
    signatureInfo: state.signatureInfo
  };
};

export default connect(mapStateToProps)(LoginConsent);