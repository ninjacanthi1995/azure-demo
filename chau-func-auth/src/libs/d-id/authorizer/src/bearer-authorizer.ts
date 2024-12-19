// import { logger } from '@de-id/logging';
import { User, AuthenticationClient } from 'auth0';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import keyBy from 'lodash/keyBy';
import { Authorization } from '../../domain/src/types';
import { AuthorizationError } from '../../errors/src';
import { trialApiKeys } from '../../platform-aws/src';
import { AuthorizeOptions, AuthorizeOutput, ConstructorParams } from './authorizer';
import { Auth0BaseAuthorizer } from './auth0-base-authorizer';

export interface AccessTokenAuthorizerAuthorizeOptions extends AuthorizeOptions {
    accessToken: string;
}

export interface BearerAuthorizerParams {
    audience: string;
    issuer: string;
    deprecatedIssuer: string;
    jwksUri: string;
}

export class BearerAuthorizer extends Auth0BaseAuthorizer<AccessTokenAuthorizerAuthorizeOptions> {
    jwksClient: jwksClient.JwksClient;
    auth0Namespace = 'https://d-id.com/';

    public constructor(
        protected readonly params: ConstructorParams,
        protected readonly auth0: AuthenticationClient,
        private readonly auth0Params: BearerAuthorizerParams
    ) {
        super(params, auth0);
        this.jwksClient = jwksClient({
            cache: true,
            rateLimit: true,
            jwksRequestsPerMinute: 10, // Default value
            jwksUri: this.auth0Params.jwksUri,
        });
        this.trialApiKeys = keyBy(trialApiKeys[params.env], 'name');
    }

    public async authorize(header: string): Promise<AuthorizeOutput> {
        // logger.debug('Authorizing...');
        const accessToken = this.parseHeader(header);
        const decoded = jwt.decode(accessToken, { complete: true });
        if (!decoded || !decoded.header || !decoded.header.kid) {
            throw new AuthorizationError('invalid token');
        }
        const signingKey = await this.jwksClient.getSigningKeyAsync(decoded.header.kid);
        const authUser = this.verify(accessToken, signingKey!.getPublicKey());
        const user = this.convertClaimsToAppMetadata(authUser, this.auth0Namespace);
        // logger.debug('user after getProfile', { user });
        return this.transformAuthorization(user, 'bearer');
    }

    private convertClaimsToAppMetadata(authUser: any, namespace: string) {
        const appMetadata: any = {};

        for (const claim in authUser) {
            if (Object.prototype.hasOwnProperty.call(authUser, claim) && claim.startsWith(namespace)) {
                const newKey = claim.replace(namespace, '');
                appMetadata[newKey] = authUser[claim];
            }
        }

        return {
            ...authUser,
            app_metadata: appMetadata,
            user_id: authUser.sub,
        };
    }

    protected transformAuthorization(user: User, authorizer: Authorization) {
        // logger.debug('transformAuthorization');
        return {
            isAllowed: true,
            // policy: this.getAllowPolicy(this.params.defaultPrincipalId),
            user: {
                id: user.user_id!,
                usageIdentifierKey: this.params.defaultIdentifierKey,
                attributes: this.transformAttributes(user, authorizer),
            },
        };
    }

    private parseHeader(header: string): string {
        return header.replace('Bearer ', '');
    }

    private verify(token: string, key: string) {
        try {
            return jwt.verify(token, key, {
                audience: this.auth0Params.audience,
                issuer: this.auth0Params.issuer,
            });
        } catch (error) {
            try {
                return jwt.verify(token, key, {
                    audience: this.auth0Params.audience,
                    issuer: this.auth0Params.issuer,
                });
            } catch (error) {
                try {
                    return jwt.verify(token, key, {
                        audience: this.auth0Params.audience,
                        issuer: this.auth0Params.deprecatedIssuer,
                    });
                } catch (error) {
                    // logger.debug('Error verifying token', { error });
                    throw new AuthorizationError('invalid token');
                }
            }
        }
    }
}
