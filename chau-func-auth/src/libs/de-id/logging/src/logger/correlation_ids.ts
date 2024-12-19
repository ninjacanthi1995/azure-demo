export const Correlation = {
    ID: 'x-did-correlation-id',
    USER: 'x-did-correlation-user',
    DEBUG_LOG: 'x-did-correlation-debug',
};

export class CorrelationIds {
    private correlations: Map<string, string>;

    public constructor(entries: CorrelationIds | Iterable<readonly [string, string]> = []) {
        if (entries instanceof CorrelationIds) {
            this.correlations = new Map(entries.correlations);
        } else {
            this.correlations = new Map();
            this.appendAll(Object.fromEntries(entries), false);
        }
    }

    private static normalizeKey(key: string) {
        const prefixedKey = key.startsWith('x-did-correlation-') ? key : 'x-did-correlation-' + key;
        return prefixedKey.toLowerCase();
    }

    public set(key: string, value: string) {
        return this.correlations.set(CorrelationIds.normalizeKey(key), value);
    }

    public get(key: string) {
        return this.correlations.get(key) || this.correlations.get(`x-did-correlation-${key}`);
    }

    public clear() {
        return this.correlations.clear();
    }

    public get size() {
        return this.correlations.size;
    }

    public replace(other: CorrelationIds) {
        this.correlations = new Map(other.correlations);
    }

    public appendAll(obj: Object, prefixOnly = true) {
        for (const key in obj) {
            if (prefixOnly) {
                if (key.toLowerCase().startsWith('x-did-correlation-')) {
                    this.set(key, obj[key]!);
                }
            } else {
                this.set(key, obj[key]!);
            }
        }
    }

    public toObject() {
        return Object.fromEntries(this.correlations.entries());
    }

    public get id() {
        return this.correlations.get(Correlation.ID) || '';
    }
    public set id(value: string) {
        this.set(Correlation.ID, value);
    }

    public get user() {
        return this.correlations.get(Correlation.USER) || '';
    }
    public set user(value: string) {
        this.set(Correlation.USER, value);
    }

    public get debugLogging() {
        return this.correlations.get(Correlation.DEBUG_LOG)?.toLowerCase() === 'true';
    }
    public set debugLogging(value: boolean) {
        this.set(Correlation.DEBUG_LOG, value.toString());
    }
}

export const globalCorrelationIds = new CorrelationIds();
