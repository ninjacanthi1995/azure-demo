export interface JsonError {
    kind: string;
    description: string;
    details?: any;
}

export abstract class BaseError extends Error {
    readonly statusCode: number;

    protected constructor(message: string, public readonly originalError?: Error) {
        super(message);
        Object.setPrototypeOf(this, BaseError.prototype);
    }

    abstract toJson(): JsonError;
}
