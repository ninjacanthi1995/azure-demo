import { AuthenticationClient, ManagementClient, User } from 'auth0';
// import { AuthorizerPolicyBuilder, AuthPolicy } from './authorizer-policy-builder';
import { Authorization } from '../../domain/src/types';

export interface AuthorizeOptions {}

export interface UserAttributes {
    id: string;
    email: string;
    user_metadata?: string;
    app_metadata?: string;
    features?: string;
    authorizer: Authorization;
}

export interface AuthorizeOutput {
    isAllowed: boolean;
    // policy: AuthPolicy;
    user?: {
        usageIdentifierKey: string;
        id: string;
        attributes: UserAttributes;
    };
}

export interface ConstructorParams {
    accountId: string;
    region: string;
    restApiId: string;
    defaultPrincipalId: string;
    defaultIdentifierKey: string;
    env: string;
}

export abstract class Authorizer<T extends AuthorizeOptions> {
    public constructor(
        protected readonly params: ConstructorParams,
        protected readonly auth0: AuthenticationClient | ManagementClient
    ) {}

    public abstract authorize(header: string, origin?: string): Promise<AuthorizeOutput>;

    protected getHashedApiKey(user: User): string {
        return user.app_metadata?.api_key;
    }

    protected getAwsApiKey(user: User): { principalId: string; usageIdentifierKey: string } {
        const { email, app_metadata } = user;
        const { usage_identifier_key, api_gateway_key_name } = app_metadata || {};

        const principalId = api_gateway_key_name ?? email;
        return {
            principalId,
            usageIdentifierKey: usage_identifier_key,
        };
    }

    // protected getAllowPolicy(principalId: string) {
    //     return this.getPolicyBuilder(principalId).allowAllMethods().build();
    // }

    // protected getDenyPolicy(principalId: string) {
    //     return this.getPolicyBuilder(principalId).denyAllMethods().build();
    // }

    // protected getPolicyBuilder(principalId: string) {
    //     return new AuthorizerPolicyBuilder(principalId, this.params.accountId, {
    //         restApiId: this.params.restApiId,
    //     });
    // }

    protected transformAuthorization(user: User, authorizer: Authorization, ...args: any[]) {
        const apiKey = this.getAwsApiKey(user);
        return {
            isAllowed: true,
            // policy: this.getAllowPolicy(apiKey!.principalId),
            user: {
                id: user.user_id!,
                usageIdentifierKey: apiKey!.usageIdentifierKey,
                attributes: this.transformAttributes(user, authorizer),
            },
        };
    }

    protected transformAttributes(user: User, authorizer: Authorization) {
        return {
            id: user.user_id!,
            email: user.email || user.app_metadata?.email,
            user_metadata: JSON.stringify(user.user_metadata),
            app_metadata: JSON.stringify(user.app_metadata),
            features: user.app_metadata?.features,
            authorizer,
        };
    }
}
