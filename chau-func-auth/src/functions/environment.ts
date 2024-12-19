import * as env from 'env-var';

export const restApiId = env.get('REST_API_ID').required().asString();
export const awsDefaultRegion = env.get('AWS_DEFAULT_REGION').required().asString();
export const accountId = env.get('AWS_ACCOUNT_ID').required().asString();
export const nodeEnv = env.get('NODE_ENV').required().asString();
export const awsLambdaFunctionName = env.get('AWS_LAMBDA_FUNCTION_NAME').required().asString().toLowerCase();
export const awsLambdaFunctionVersion = env.get('AWS_LAMBDA_FUNCTION_VERSION').required().asString();
export const isProd = nodeEnv === 'prod';
export const isDev = nodeEnv === 'dev';
export const isTest = nodeEnv === 'test';
export const logLevel = env
    .get('LOG_LEVEL')
    .default(isTest ? 'debug' : 'info')
    .asString()
    .toLowerCase();
export const sentryDsn = env.get('SENTRY_DSN').required(!isTest).asString();
export const sentryTracesSampleRate = env.get('SENTRY_TRACES_SAMPLE_RATE').default(0.001).asFloatPositive();
export const sentryEnabled = !!sentryDsn;
export const authDomain = env.get('AUTH_DOMAIN').required().asString();
export const authClientId = env.get('AUTH_CLIENT_ID').required().asString();
export const authClientSecret = env.get('AUTH_CLIENT_SECRET').required().asString();
export const authUrl = `https://${authDomain}`;
export const issuer = env.get('AUTH_ISSUER').required().asString();
export const jwksUri = `${authUrl}/.well-known/jwks.json`;
export const audience = `${authUrl}/api/v2/`;
export const deprecatedIssuer = `${authUrl}/`;
export const defaultPrincipalId = env.get('DEFAULT_PRINCIPAL_ID').required().asString();
export const defaultIdentifierKey = env.get('DEFAULT_IDENTIFIER_KEY').required().asString();
export const clientKeysTableName = env.get('CLIENT_KEYS_TABLE_NAME').required().asString();
