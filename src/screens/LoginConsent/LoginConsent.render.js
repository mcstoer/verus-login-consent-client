import React from 'react';
import {
  CONSENT_TO_SCOPE,
  EXTERNAL_ACTION,
  LOADING_DISPLAY,
  REDIRECT,
  SELECT_LOGIN_ID,
  PROVISIONING_FORM,
  PROVISIONING_CONFIRM,
  PROVISIONING_RESULT,
  CREDENTIALS_REVIEW,
  IDENTITY_UPDATE_CONFIRM,
  IDENTITY_UPDATE_CORE,
  IDENTITY_UPDATE_CONTENTMULTIMAP,
  IDENTITY_UPDATE_RESULT,
} from '#/utils/constants';
import ExternalAction from './ExternalAction/ExternalAction';
import Loading from '#components/Loading';
import Error from './Error/Error';
import Login from './Login/Login';
import {setError} from '#/redux/reducers/error/error.actions';
import Redirect from './Redirect/Redirect';
import Consent from './Consent/Consent';
import ProvisionIdentityForm from './ProvisionIdentity/ProvisionIdentityForm/ProvisionIdentityForm';
import ProvisionIdentityConfirm from './ProvisionIdentity/ProvisionIdentityConfirm/ProvisionIdentityConfirm';
import ProvisionIdentityResult from './ProvisionIdentity/ProvisionIdentityResult/ProvisionIdentityResult';
import CredentialsReview from './CredentialsReview/CredentialsReview';
import IdentityUpdateConfirm from './IdentityUpdate/Confirm';
import IdentityUpdateCore from './IdentityUpdate/Core';
import IdentityUpdateContentMultiMap from './IdentityUpdate/ContentMultiMap';
import IdentityUpdateResult from './IdentityUpdate/Result';

export const LoginConsentRender = function () {
  const COMPONENT_PROPS = {
    pathArray: this.props.pathArray,
    completeLoginConsent: this.completeLoginConsent,
    requestResult: this.state.requestResult,
    setRequestResult: this.getRequestResult,
    canProcessRequest: this.canProcessRequest,
    handleRequest: this.handleRequest,
    checkRequest: this.checkRequest,
  };

  const COMPONENT_MAP = {
    [EXTERNAL_ACTION]: <ExternalAction {...COMPONENT_PROPS} />,
    [REDIRECT]: <Redirect {...COMPONENT_PROPS} />,
    [SELECT_LOGIN_ID]: <Login {...COMPONENT_PROPS} />,
    [CONSENT_TO_SCOPE]: <Consent {...COMPONENT_PROPS} />,
    [IDENTITY_UPDATE_CONFIRM]: <IdentityUpdateConfirm {...COMPONENT_PROPS} />,
    [IDENTITY_UPDATE_CORE]: <IdentityUpdateCore {...COMPONENT_PROPS} />,
    [IDENTITY_UPDATE_CONTENTMULTIMAP]: <IdentityUpdateContentMultiMap {...COMPONENT_PROPS} />,
    [IDENTITY_UPDATE_RESULT]: <IdentityUpdateResult {...COMPONENT_PROPS} />,
    [CREDENTIALS_REVIEW]: <CredentialsReview {...COMPONENT_PROPS} />,
    [PROVISIONING_FORM]: <ProvisionIdentityForm {...COMPONENT_PROPS} />,
    [PROVISIONING_CONFIRM]: <ProvisionIdentityConfirm {...COMPONENT_PROPS} />,
    [PROVISIONING_RESULT]: <ProvisionIdentityResult {...COMPONENT_PROPS} />,
    [LOADING_DISPLAY]: <Loading />,
  };

  return this.props.error != null ? (
    <Error
      error={this.props.error}
      clearError={() => this.props.dispatch(setError(null))}
      completeLoginConsent={this.completeLoginConsent}
    />
  ) : this.props.port != null && this.props.originApp != null ? (
    this.props.pathArray[0] ? (
      COMPONENT_MAP[this.props.pathArray[0]]
    ) : null
  ) : (
    <Loading />
  );
};
