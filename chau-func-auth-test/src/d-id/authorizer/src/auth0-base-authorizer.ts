import { AuthorizeOptions, Authorizer } from './authorizer';

export abstract class Auth0BaseAuthorizer<T extends AuthorizeOptions> extends Authorizer<T> {
    protected getAwsApiKey(user: any): { principalId: string; usageIdentifierKey: string } {
        const { email, app_metadata } = user;
        const { usage_identifier_key, api_gateway_key_name } = app_metadata || {};

        return {
            principalId: email!,
            usageIdentifierKey: usage_identifier_key,
        };
    }
}
