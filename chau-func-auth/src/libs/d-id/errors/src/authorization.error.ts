import { HttpStatus } from '../../http-status/src';
import { BaseError, JsonError } from './base.error';

export class AuthorizationError extends BaseError {
    readonly statusCode = HttpStatus.UNAUTHORIZED;

    constructor(message?: string) {
        super(message ?? 'user unauthenticated');
        Object.setPrototypeOf(this, AuthorizationError.prototype);
    }

    toJson(): JsonError {
        return {
            kind: 'AuthorizationError',
            description: this.message,
        };
    }
}
