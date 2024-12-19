import { default as dev } from './dev';
import { default as prod } from './prod';

export interface AwsGatewayKey {
    name?: string;
    usage_identifier_key: string;
    api_gateway_key_id: string;
    isTrial?: boolean;
}

export const trialApiKeys = {
    prod,
    dev,
};
