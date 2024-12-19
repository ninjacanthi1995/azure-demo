import { AuthenticationClient, ManagementClient } from 'auth0';

import { authorizerOptions } from './config';
import { authDomain, authClientId, authClientSecret, audience, issuer, deprecatedIssuer, jwksUri, clientKeysTableName } from '../environment';
import { BearerAuthorizer } from '../../libs/d-id/authorizer/src/bearer-authorizer';
import { AuthorizeOptions, Authorizer } from '../../libs/d-id/authorizer/src/authorizer';

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

// const basicAuthorizer = new BasicAuthorizer(authorizerOptions, auth0ManagementClient);

// const clientKeyAuthorizer = new ClientKeyAuthorizer(authorizerOptions, auth0ManagementClient, clientKeysTableName);

// export function getAuthorizer(header?: string): Authorizer<AuthorizeOptions> {
export function getAuthorizer(header?: string): any {
    // if (header?.startsWith('Basic ')) {
    //     return basicAuthorizer;
    // }
    if (header?.startsWith('Bearer ')) {
        return bearerAuthorizer;
    }
    // if (header?.startsWith('Client-Key ')) {
    //     return clientKeyAuthorizer;
    // }
    throw new Error("couldn't find a valid Authorization header");
}
