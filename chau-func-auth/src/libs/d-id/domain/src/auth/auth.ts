import { Request } from '../../../../../../../serverless/node_modules/@d-id/domain/src/types';
import { AuthorizationError } from '../../../errors/src';
import { User } from '../types';

export function getUser(request: Request): User {
    const unparsedUser = request.headers['user'] as string;
    if (!unparsedUser) {
        throw new AuthorizationError();
    }
    return JSON.parse(unparsedUser);
}

export function getOptionalUser(request: Request): User | undefined {
    const unparsedUser = request.headers['user'] as string;
    if (!unparsedUser) {
        return undefined;
    }
    return JSON.parse(unparsedUser);
}
