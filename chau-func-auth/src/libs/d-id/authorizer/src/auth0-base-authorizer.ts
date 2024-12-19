import { User } from 'auth0';
import { AuthorizeOptions, Authorizer } from './authorizer';
import { AwsGatewayKey } from '../../platform-aws/src';

export abstract class Auth0BaseAuthorizer<T extends AuthorizeOptions> extends Authorizer<T> {
    trialApiKeys: { [key: string]: AwsGatewayKey };
    protected getAwsApiKey(user: User): { principalId: string; usageIdentifierKey: string } {
        const { email, app_metadata } = user;
        const { usage_identifier_key, api_gateway_key_name } = app_metadata || {};

        if (this.isTrialApiKey(api_gateway_key_name) || !usage_identifier_key) {
            return {
                principalId: this.params.defaultPrincipalId,
                usageIdentifierKey: this.params.defaultIdentifierKey,
            };
        }

        return {
            principalId: email!,
            usageIdentifierKey: usage_identifier_key,
        };
    }
    private isTrialApiKey(name: string): boolean {
        return !!this.trialApiKeys[name];
    }
}
