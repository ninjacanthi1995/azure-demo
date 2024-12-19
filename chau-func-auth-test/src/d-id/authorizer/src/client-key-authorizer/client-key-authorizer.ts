import { ManagementClient } from 'auth0';
import keyBy from 'lodash/keyBy';

import { Auth0BaseAuthorizer } from '../auth0-base-authorizer';
import { AuthorizeOptions, AuthorizeOutput, ConstructorParams } from '../authorizer';
import { isStudioDomain } from '../../../domain/src';

export interface ClientKeyAuthorizerAuthorizeOptions extends AuthorizeOptions {
    client_key: string;
}

export class ClientKeyAuthorizer extends Auth0BaseAuthorizer<ClientKeyAuthorizerAuthorizeOptions> {
    public constructor(
        protected readonly params: ConstructorParams,
        protected readonly auth0: ManagementClient,
        private readonly clientKeyTableName: string
    ) {
        super(params, auth0);
        // this.trialApiKeys = keyBy(trialApiKeys[params.env], 'name');
    }

    public async authorize(header: string, origin: string): Promise<AuthorizeOutput> {
        const [clientKey, external_id] = this.parseHeader(header);

        const clientKeyEntity = {
            sk: clientKey,
            allowed_domains: ['*'],
            pk: 'org_123',
            email: 'test@gmail.com',
            org_id: 'org_123',
            use_case: 'use_case',
        }

        // const clientKeyEntity = await dynamoDb
        //     .query({
        //         TableName: this.clientKeyTableName,
        //         IndexName: 'client_key-index',
        //         KeyConditionExpression: 'sk = :client_key',
        //         ExpressionAttributeValues: { ':client_key': clientKey },
        //     })
        //     .promise()
        //     .then(({ Items }) => Items?.[0]);

        if (!clientKeyEntity || clientKeyEntity.sk !== clientKey) {
            throw new Error('invalid Client-Key');
        }

        const userAllowedOrigins = clientKeyEntity.allowed_domains
            .map(domain => {
                try {
                    if (domain === '*') {
                        return domain;
                    }

                    return new URL(domain).hostname;
                } catch (e) {
                    return '';
                }
            })
            .concat(['websocket'])
            .filter(Boolean);

        if (
            !isStudioDomain(origin) &&
            !userAllowedOrigins.includes('*') &&
            (!origin || !userAllowedOrigins.includes(new URL(origin).hostname))
        ) {
            throw new Error('origin not allowed');
        }

        let existingUser: any;
        if (clientKeyEntity.pk.startsWith('org_')) {
            existingUser = await this.getUserByEmail(clientKeyEntity.email);
        } else {
            existingUser = await this.getUser(clientKeyEntity.pk);
        }

        let user: any = {
            user_id: clientKeyEntity.pk,
            email: clientKeyEntity.email,
            user_metadata: {},
            app_metadata: {
                usage_identifier_key:
                    existingUser?.app_metadata?.usage_identifier_key || this.params.defaultIdentifierKey,
                org_id: clientKeyEntity.org_id,
                features: existingUser?.app_metadata?.features,
                stripe_plan_group: existingUser?.app_metadata?.stripe_plan_group,
                stripe_product_name: existingUser?.app_metadata?.stripe_product_name,
                plan: existingUser?.app_metadata?.plan,
            },
        };

        const clientKeyUseCase = clientKeyEntity.use_case;

        return this.transformAuthorization(user, 'client-key', clientKeyUseCase, external_id);
    }

    private async getUser(userId: string) {
        return await (this.auth0 as ManagementClient).users.get({ id: userId });
    }

    private async getUserByEmail(email: string) {
        const users = await (this.auth0 as ManagementClient).usersByEmail.getByEmail({ email });
        return users.data[0];
    }

    private parseHeader(header: string) {
        return header.replace('Client-Key ', '').split('.');
    }

    protected transformAuthorization(user: any, authorizer: any, useCase: string, external_id?: string) {
        const apiKey = this.getAwsApiKey(user);
        const attributes = this.transformAttributes(user, authorizer);

        if (external_id) {
            attributes['external_id'] = external_id;
        }

        return {
            isAllowed: true,
            user: {
                id: user.user_id!,
                attributes,
                usageIdentifierKey: apiKey.usageIdentifierKey,
            },
        };
    }
}
