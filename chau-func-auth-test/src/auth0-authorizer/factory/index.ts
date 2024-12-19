import { AuthenticationClient, ManagementClient } from 'auth0';

import {
    audience,
    authClientId,
    authClientSecret,
    authDomain,
    clientKeysTableName,
    deprecatedIssuer,
    issuer,
    jwksUri,
} from '../environment';
import { authorizerOptions } from './config';
import { BasicAuthorizer, BearerAuthorizer, ClientKeyAuthorizer } from '../../d-id/authorizer/src';
import { InvocationContext } from '@azure/functions';

const auth0AuthenticationClient = new AuthenticationClient({
    domain: authDomain,
    clientId: authClientId,
    clientSecret: authClientSecret,
});

const auth0ManagementClient = new ManagementClient({
    domain: authDomain,
    clientId: authClientId,
    clientSecret: authClientSecret,
});

const bearerAuthorizer = new BearerAuthorizer(authorizerOptions, auth0AuthenticationClient, {
    audience,
    issuer,
    deprecatedIssuer,
    jwksUri,
});

const basicAuthorizer = (context: InvocationContext) => new BasicAuthorizer(authorizerOptions, auth0ManagementClient, context);

const clientKeyAuthorizer = new ClientKeyAuthorizer(authorizerOptions, auth0ManagementClient, clientKeysTableName);

export function getAuthorizer(context: InvocationContext, header?: string): any {
    if (header?.startsWith('Basic ')) {
        return basicAuthorizer(context);
    }
    if (header?.startsWith('Bearer ')) {
        return bearerAuthorizer;
    }
    if (header?.startsWith('Client-Key ')) {
        return clientKeyAuthorizer;
    }
    throw new Error("couldn't find a valid Authorization header");
}
