import { InvocationContext } from '@azure/functions';
import { AuthenticationClient, ManagementClient } from 'auth0';

export interface AuthorizeOptions {}

export interface UserAttributes {
    id: string;
    email: string;
    user_metadata?: string;
    app_metadata?: string;
    features?: string;
    authorizer: any;
}

export interface AuthorizeOutput {
    isAllowed: boolean;
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

    protected getHashedApiKey(user: any): string {
        return user.app_metadata?.api_key;
    }

    protected getAwsApiKey(user: any): { principalId: string; usageIdentifierKey: string } {
        const { email, app_metadata } = user;
        const { usage_identifier_key, api_gateway_key_name } = app_metadata || {};

        const principalId = api_gateway_key_name ?? email;
        return {
            principalId,
            usageIdentifierKey: usage_identifier_key,
        };
    }

    protected transformAuthorization(user: any, authorizer: any, ...args: any[]) {
        const apiKey = this.getAwsApiKey(user);
        return {
            isAllowed: true,
            user: {
                id: user.user_id!,
                usageIdentifierKey: apiKey!.usageIdentifierKey,
                attributes: this.transformAttributes(user, authorizer),
            },
        };
    }

    protected transformAttributes(user: any, authorizer: any) {
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
