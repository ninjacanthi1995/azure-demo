import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getAuthorizer } from "./factory";
import { defaultIdentifierKey } from "./environment";
import { BaseError } from "../libs/d-id/errors/src";

export async function httpTriggerChau(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`entered authorizer ${request.url} ${request.method}`);
    const headers = request.headers || {};
    const authorizationHeader = headers['Authorization'] || headers['authorization'];
    const origin = headers['origin'] || headers['Origin'] || headers['x-origin'];

    try {
        const authorizer = getAuthorizer(authorizationHeader);
        const authorization = await authorizer.authorize(authorizationHeader!, origin);
        context.log('finished authorizer', { authorization });

        const usageIdentifierKey = authorization.user?.usageIdentifierKey;
        if (authorization.isAllowed) {
            if (!usageIdentifierKey) {
                context.error('usageIdentifierKey does not exist', { user: authorization.user?.attributes.email });
            }
            if (usageIdentifierKey === defaultIdentifierKey) {
                context.debug('usageIdentifierKey is the default', {
                    defaultIdentifierKey,
                    user: authorization.user,
                });
            }
        }
        return { status: 200, jsonBody: { status: 200 } };
    } catch (error) {
        const meta = { error, authorizationHeader, path: request.url };
        if (error instanceof BaseError) {
            context.info('error in authorizer', meta);
        } else if ((error as Error).message === 'UserNotFoundException') {
            context.warn('unauthorized user attempt', meta);
        } else if ((error as Error).name === 'TokenExpiredError') {
            context.warn('token expired', meta);
        } else {
            context.error('error in authorizer', meta);
        }
        return { status: 403, jsonBody: { status: 403 } };
    }
};

app.http('httpTriggerChau', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: httpTriggerChau,
});
