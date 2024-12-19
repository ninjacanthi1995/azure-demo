import {
    restApiId,
    defaultIdentifierKey,
    defaultPrincipalId,
    accountId,
    awsDefaultRegion as region,
    nodeEnv,
} from '../environment';

export const authorizerOptions = {
    accountId,
    region,
    restApiId,
    defaultPrincipalId,
    defaultIdentifierKey,
    env: nodeEnv,
};
