// import { logger } from '@de-id/logging';
import { ManagementClient } from 'auth0';
import base64url from 'base64url';
import bcrypt from 'bcryptjs';
import { AuthorizeOptions, AuthorizeOutput, Authorizer, ConstructorParams } from './authorizer';
import { findAsync } from '../../utils/src';
import { InvocationContext } from '@azure/functions';

export interface BasicAuthorizerOptions extends AuthorizeOptions {
    username: string;
    apiKey: string;
}

export class BasicAuthorizer extends Authorizer<BasicAuthorizerOptions> {
    logger: InvocationContext;
    public constructor(
        protected readonly params: ConstructorParams,
        protected readonly auth0: ManagementClient,
        context: InvocationContext
    ) {
        super(params, auth0);
        this.logger = context;
    }
    
    public async authorize(header: string): Promise<AuthorizeOutput> {
        // logger.debug('Authorizing ...');
        const { username, apiKey } = this.parseHeader(header);
        this.logger.log('username', username);
        this.logger.log('apiKey', apiKey);
        if (!username || !apiKey) {
            throw new Error('invalid token');
        }
        const users = await this.getUsers(username);
        this.logger.log('users', users);
        if (!users.length) {
            // logger.info('user was not found', { user: { username, apiKey } });
            return { isAllowed: false };
        }

        const user = await this.getValidUser(apiKey, users);
        this.logger.log('user', user);
        if (!user) {
            // logger.info('User provided an invalid api key', { user: username, apiKey });
            return { isAllowed: false };
        }

        return this.transformAuthorization(user, 'basic');
    }

    private parseHeader(header: string): { username: string; apiKey: string } {
        const token = header.substring(6);
        const credentials = this.isBase64(token) ? base64url.decode(token) : token;
        const [encodedUsername, apiKey] = credentials.split(':');
        const username = base64url.decode(encodedUsername);
        return { username, apiKey };
    }

    private isBase64(token: string): Boolean {
        return !token.includes(':');
    }

    private async getUsers(email: string): Promise<any[]> {
        const users = await (this.auth0 as ManagementClient).usersByEmail.getByEmail({ email });
        this.logger.log('users by email', users);
        return users.data.filter(user => !!user.app_metadata?.api_key && !user.blocked && user.email_verified);
    }

    private getValidUser(apiKey: string, users: any[]): Promise<any | undefined> {
        const isValidApiKey = this.isValidApiKey(apiKey);
        return findAsync(users, isValidApiKey);
    }

    private isValidApiKey(apiKey: string): (user: any) => Promise<boolean> {
        this.logger.log('apiKey', apiKey);
        this.logger.log('getHashedApiKey', this.getHashedApiKey);
        // return user => Promise.resolve(true);
        return user => bcrypt.compare(apiKey, this.getHashedApiKey(user));
    }
}
