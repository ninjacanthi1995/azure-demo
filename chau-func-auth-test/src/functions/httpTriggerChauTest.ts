import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getAuthorizer } from "../auth0-authorizer/factory";
import { defaultIdentifierKey } from "../auth0-authorizer/environment";

export async function httpTriggerChauTest(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    const headers = request.headers || {};
    context.log('headers', headers);
    
    const authorizationHeader = readHeader(request, 'Authorization') || readHeader(request, 'authorization');
    const origin = headers['origin'] || headers['Origin'] || headers['x-origin'];
    context.log('authorizationHeader', authorizationHeader);

    try {
        const authorizer = getAuthorizer(context, authorizationHeader);
        const authorization = await authorizer.authorize(authorizationHeader!, origin);
        context.log('authorization', authorization);

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
            return { jsonBody: { status: 200 } };
        }
        return { jsonBody: { status: 403 } };
    } catch (error) {
        if ((error as Error).message === 'UserNotFoundException') {
            context.warn('unauthorized user attempt');
        } else if ((error as Error).name === 'TokenExpiredError') {
            context.warn('token expired');
        } else {
            context.error('error in authorizer', error);
        }
        return { jsonBody: { status: 403 } };
    }

};

function readHeader(request: HttpRequest, key: string): string {
    return Object.fromEntries(request.headers.entries())[key];
}

app.http('httpTriggerChauTest', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: httpTriggerChauTest
});
