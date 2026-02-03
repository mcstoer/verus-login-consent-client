import Loading from '#/components/Loading';
import {setError} from '#/redux/reducers/error/error.actions';
import {
  CONSENT_TO_SCOPE,
  CREDENTIALS_REVIEW,
  EXTERNAL_ACTION,
  IDENTITY_UPDATE_CONTENTMULTIMAP,
  IDENTITY_UPDATE_CORE,
  LOADING_DISPLAY,
  PROVISIONING_CONFIRM,
  PROVISIONING_FORM,
  PROVISIONING_RESULT,
  REDIRECT,
  SELECT_LOGIN_ID,
} from '#/utils/constants';
import React from 'react';
import Consent from './Consent/Consent';
import CredentialsReview from './CredentialsReview/CredentialsReview';
import Error from './Error/Error';
import ExternalAction from './ExternalAction/ExternalAction';
import IdentityUpdateContentMultiMap from './IdentityUpdate/ContentMultiMap';
import IdentityUpdateCore from './IdentityUpdate/Core';
import Login from './Login/Login';
import ProvisionIdentityConfirm from './ProvisionIdentity/ProvisionIdentityConfirm/ProvisionIdentityConfirm';
import ProvisionIdentityForm from './ProvisionIdentity/ProvisionIdentityForm/ProvisionIdentityForm';
import ProvisionIdentityResult from './ProvisionIdentity/ProvisionIdentityResult/ProvisionIdentityResult';
import Redirect from './Redirect/Redirect';

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
    [IDENTITY_UPDATE_CORE]: <IdentityUpdateCore {...COMPONENT_PROPS} />,
    [IDENTITY_UPDATE_CONTENTMULTIMAP]: <IdentityUpdateContentMultiMap {...COMPONENT_PROPS} />,
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
