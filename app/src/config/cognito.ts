// AWS Cognito Configuration
// This file contains the configuration for AWS Cognito authentication

export interface CognitoConfig {
  region: string;
  userPoolId: string;
  userPoolClientId: string;
  identityPoolId: string;
  oauth?: {
    domain: string;
    scope: string[];
    redirectSignIn: string;
    redirectSignOut: string;
    responseType: string;
  };
}

// Load configuration from environment variables
const cognitoConfig: CognitoConfig = {
  region: process.env.REACT_APP_AWS_REGION || 'us-east-1',
  userPoolId: process.env.REACT_APP_USER_POOL_ID || '',
  userPoolClientId: process.env.REACT_APP_USER_POOL_CLIENT_ID || '',
  identityPoolId: process.env.REACT_APP_IDENTITY_POOL_ID || '',
  oauth: {
    domain: process.env.REACT_APP_COGNITO_DOMAIN || '',
    scope: ['email', 'openid', 'profile'],
    redirectSignIn: process.env.REACT_APP_REDIRECT_SIGN_IN || window.location.origin,
    redirectSignOut: process.env.REACT_APP_REDIRECT_SIGN_OUT || window.location.origin,
    responseType: 'code',
  },
};

// Validate configuration
export const validateCognitoConfig = (): boolean => {
  const required = [
    cognitoConfig.region,
    cognitoConfig.userPoolId,
    cognitoConfig.userPoolClientId,
    cognitoConfig.identityPoolId,
  ];

  const isValid = required.every((value) => value && value.length > 0);

  if (!isValid) {
    console.error('Missing required Cognito configuration. Please check your environment variables.');
    console.error('Required variables:', {
      REACT_APP_AWS_REGION: cognitoConfig.region,
      REACT_APP_USER_POOL_ID: cognitoConfig.userPoolId,
      REACT_APP_USER_POOL_CLIENT_ID: cognitoConfig.userPoolClientId,
      REACT_APP_IDENTITY_POOL_ID: cognitoConfig.identityPoolId,
    });
  }

  return isValid;
};

export default cognitoConfig;
