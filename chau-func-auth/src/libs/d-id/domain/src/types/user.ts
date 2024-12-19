export type Feature =
    | 'animations-tasks'
    | 'api-keys:write'
    | 'clips:write'
    | 'clips:admin'
    | 'driver'
    | 'logo'
    | 'no-watermark'
    | 'renders'
    | 'skip-moderation'
    | 'skip-celebrity-detection'
    | 'stitch'
    | Features.Scene
    | Features.SkipConsent
    | 'talks'
    | 'templates:read'
    | 'templates:write'
    | 'organizations:write'
    | 'organizations:read'
    | 'organizations:super'
    | 'streams:write'
    | 'streams:ttl'
    | 'streams:admin'
    | 'streams:eks'
    | 'cloud:az'
    | 'skip-credits'
    | 'subtitles'
    | 'knowledge'
    | 'clone-voice'
    | 'agents:admin'
    | 'agents:embedds'
    | 'agents:pricing'
    | 'agents:ttl'
    | 'agents:stitch'
    | 'agents:insights'
    | 'agents:new-llm'
    | 'agents:enlarged-chunk'
    | 'llm-stream'
    | 'audio-only'
    | Features.SkipCloneVoice
    | 'translation'
    | Features.SkipLimit
    | Features.SkipTtsVoiceConsent
    | Features.InternalAvatarValidations
    | Features.ExpressOverrideMinDuration
    | Features.TranslationsSkipScenesDurationLimit
    | Features.PremiumPlusNoDurationCheck
    | Features.IncludeDebugInfo
    | Features.PremiumPlusSkipSpeakerValidation;

export enum Features {
    SkipCloneVoice = 'skip-clone-voice',
    SkipLimit = 'skip-limit',
    SkipConsent = 'consents:skip',
    SkipTtsVoiceConsent = 'tts-voice-consent:skip',
    Scene = 'scene',
    InternalAvatarValidations = 'scenes:avatars-internal-validations',
    ExpressOverrideMinDuration = 'express:skip-min-duration',
    TranslationsSkipScenesDurationLimit = 'translations:skip-scenes-duration-limit',
    PremiumPlusNoDurationCheck = 'premium-plus:no-duration-check',
    IncludeDebugInfo = 'include-debug-info',
    PremiumPlusSkipSpeakerValidation = 'premium-plus:skip-speaker-validation',
}

export type ProductName =
    | 'trial'
    | 'lite'
    | 'advanced'
    | 'pro'
    | 'enterprise'
    | 'enterprise-trial'
    | 'build'
    | 'launch'
    | 'scale'
    | 'free'
    | 'creator'
    | 'business';
export type Authorization = 'bearer' | 'basic' | 'client-key' | 'unknown';

export interface AppMetadata extends Record<string, any> {
    active: boolean;
    stripe_plan_group: PlanGroup;
    stripe_product_name: ProductName;
    features?: Feature[];
    api_key?: string;
    api_gateway_key_id?: string;
    api_gateway_key_name?: string;
    api_key_modified_at?: string;
    usage_identifier_key?: string;
    creation_timestamp?: string;
    hash_key?: string;
    country_code?: string;
    unlimited_expiry?: string;
}

const sensitiveAppMetadataKeys = ['api_key', 'api_gateway_key_id', 'api_gateway_key_name', 'api_key_modified_at'];

export function sanitizeAppMetadata(app_metadata?: AppMetadata) {
    if (!app_metadata) {
        return app_metadata;
    }
    return Object.fromEntries(Object.entries(app_metadata).filter(([key]) => !sensitiveAppMetadataKeys.includes(key)));
}

export interface User {
    id: string;
    email: string;
    owner_id: string;
    created_at?: string;
    features: Feature[];
    external_id?: string;
    stripe_customer_id?: string;
    stripe_price_id?: string;
    stripe_plan_group?: string;
    app_metadata?: AppMetadata;
    org_id?: string;
    plan?: PlanGroup | UserPlan;
    authorizer: Authorization;
    domain?: string;
}

// @deprecated - only for backwards compatibility
export enum UserPlan {
    TRIAL = 'trial',
    FREE = 'free',
    BASIC = 'basic',
    ENTERPRISE = 'enterprise',
    LITE = 'lite',
    ADVANCED = 'advanced',
    ENTERPRISE_TRIAL = 'enterprise-trial',
}

export enum PlanGroup {
    TRIAL = 'deid-trial',
    PRO = 'deid-pro',
    ENTERPRISE = 'deid-enterprise',
    LITE = 'deid-lite',
    ADVANCED = 'deid-advanced',
    BUILD = 'deid-api-build',
    LAUNCH = 'deid-api-launch',
    SCALE = 'deid-api-scale',
    ENTERPRISE_TRIAL = 'deid-enterprise-trial',
    FREE = 'deid-free',
    CREATOR = 'deid-creator',
    BUSINESS = 'deid-business',
}

export const PLAN_GROUP_TO_PRODUCT_NAME: Record<PlanGroup, ProductName> = {
    [PlanGroup.TRIAL]: 'trial',
    [PlanGroup.PRO]: 'pro',
    [PlanGroup.ENTERPRISE]: 'enterprise',
    [PlanGroup.LITE]: 'lite',
    [PlanGroup.ADVANCED]: 'advanced',
    [PlanGroup.BUILD]: 'build',
    [PlanGroup.LAUNCH]: 'launch',
    [PlanGroup.SCALE]: 'scale',
    [PlanGroup.ENTERPRISE_TRIAL]: 'enterprise-trial',
    [PlanGroup.FREE]: 'free',
    [PlanGroup.CREATOR]: 'creator',
    [PlanGroup.BUSINESS]: 'business',
};

export const isApiPlan = (planGroup: PlanGroup) =>
    [PlanGroup.BUILD, PlanGroup.LAUNCH, PlanGroup.SCALE].includes(planGroup);

export const isStudioPlan = (planGroup: PlanGroup) =>
    [PlanGroup.LITE, PlanGroup.PRO, PlanGroup.ADVANCED].includes(planGroup);

export const OVERAGE_RATE = 0.2;

export const AGENTS_PLAN_BASED_CREDIT_PER_SESSION: Record<PlanGroup | UserPlan, number> = {
    [PlanGroup.TRIAL]: 1,
    [PlanGroup.PRO]: 0.35,
    [PlanGroup.ENTERPRISE]: 0.35,
    [PlanGroup.LITE]: 1.15,
    [PlanGroup.ADVANCED]: 0.35,
    [PlanGroup.BUILD]: 0.6,
    [PlanGroup.LAUNCH]: 0.62,
    [PlanGroup.SCALE]: 0.69,
    [PlanGroup.ENTERPRISE_TRIAL]: 0.35,
    [UserPlan.TRIAL]: 1,
    [UserPlan.BASIC]: 0.6,
    [UserPlan.ENTERPRISE]: 0.35,
    [UserPlan.LITE]: 1.15,
    [UserPlan.ADVANCED]: 0.35,
    [UserPlan.ENTERPRISE_TRIAL]: 0.35,
    [PlanGroup.FREE]: 1,
    [UserPlan.FREE]: 1,
    [PlanGroup.CREATOR]: 0.35,
    [PlanGroup.BUSINESS]: 0.35,
};

export const PLAN_BASED_PREMIUM_PLUS_AVATAR_SLOTS: Record<PlanGroup, number> = {
    [PlanGroup.TRIAL]: 0,
    [PlanGroup.PRO]: 3,
    [PlanGroup.ENTERPRISE]: 5,
    [PlanGroup.LITE]: 0,
    [PlanGroup.ADVANCED]: 5,
    [PlanGroup.BUILD]: 0,
    [PlanGroup.LAUNCH]: 0,
    [PlanGroup.SCALE]: 0,
    [PlanGroup.ENTERPRISE_TRIAL]: 1,
    [PlanGroup.FREE]: 0,
    [PlanGroup.CREATOR]: 3,
    [PlanGroup.BUSINESS]: 5,
};

const D_ID_EMAIL_SUFFIXES = ['@d-id.com', '@deidentification.co'];
export const isDidUser = email => {
    return D_ID_EMAIL_SUFFIXES.some(suffix => email.includes(suffix));
};

export const FREE_PLAN_EMAIL_SUFFIX = '+free@d-id.com';
