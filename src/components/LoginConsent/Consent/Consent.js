import React from 'react';
import { connect } from 'react-redux';
import { setExternalAction, setNavigationPath } from '../../../redux/reducers/navigation/navigation.actions';
import { 
  ConsentRender
} from './Consent.render';
import { EXTERNAL_ACTION, EXTERNAL_CHAIN_START, SCOPES, SELECT_LOGIN_ID } from '../../../utils/constants';
import { checkAndUpdateIdentities } from '../../../redux/reducers/identity/identity.actions';
import { SUPPORTED_CREDENTIALS, CREDENTIALS } from '../../../utils/constants';
import PropTypes from 'prop-types';

class Consent extends React.Component {
  constructor(props) {
    super(props);
    const requestedPermissions = props.loginConsentRequest.request.challenge.requested_access;

    let permissionsDescriptions = [];

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

    this.state = {
      loading: false
    };

    this.tryLogin = this.tryLogin.bind(this);
    this.cancel = this.cancel.bind(this);
    this.permissionsText = permissionsDescriptions.join(", ");
  }

  tryLogin() {
    this.setState({ loading: true }, async () => {
      const userActions = await checkAndUpdateIdentities(this.props.chainMetadata.chainTicker);
      userActions.map(action => this.props.dispatch(action));

      if (this.props.canLoginOrGiveConsent()) {
        this.props.dispatch(setNavigationPath(SELECT_LOGIN_ID));
      } else {
        this.props.dispatch(setExternalAction(EXTERNAL_CHAIN_START));
        this.props.dispatch(setNavigationPath(EXTERNAL_ACTION));
      }
    });
  }

  cancel() {
    this.setState({ loading: true }, async () => {
      await this.props.completeLoginConsent();
    });
  }

  render() {
    return ConsentRender.call(this);
  }
}

Consent.propTypes = {
  loginConsentRequest: PropTypes.object.isRequired,
  dispatch: PropTypes.func.isRequired,
  canLoginOrGiveConsent: PropTypes.func.isRequired,
  completeLoginConsent: PropTypes.func.isRequired,
  chainMetadata: PropTypes.object.isRequired,
};

const mapStateToProps = (state) => {
  return {
    path: state.navigation.path,
    loginConsentRequest: state.rpc.loginConsentRequest,
    identities: state.identity.identities,
    activeIdentity: state.identity.activeIdentity,
    originApp: state.origin.originApp,
    chainMetadata: state.chainMetadata.chainTicker,
    signatureInfo: state.signatureInfo
  };
};

export default connect(mapStateToProps)(Consent);