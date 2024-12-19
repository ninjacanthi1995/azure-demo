import axios from 'axios';
import fastRedact from 'fast-redact';
import castArray from 'lodash/castArray';
import pick from 'lodash/pick';
import * as winston from 'winston';
import Transport from 'winston-transport';
import SentryTransport from 'winston-transport-sentry-node';

import { globalCorrelationIds, CorrelationIds } from './correlation_ids';

type Level = 'debug' | 'info' | 'warn' | 'error';

type LoggerOptions = winston.LoggerOptions & {
    app: string;
    nodeEnv: string;
    name?: string;
    redact?: string[];
    cloudWatch?: boolean;
    correlationIds?: CorrelationIds;
    sentryDsn?: string;
};

export interface ParsedLogMessage {
    level: string;
    id?: string;
    user?: string;
    app?: string;
    message: string;
    meta?: {
        meta: Record<string, string>;
        defaultMeta?: Record<string, string>;
        correlationIds?: Record<string, string>;
    };
}

export type Meta = Record<string, any>;

export const redact = (obj: Record<string, any>, paths: string[]) => {
    try {
        return fastRedact({ paths, serialize: o => JSON.stringify(o, null, 2) })(obj) as string;
    } catch (error) {
        console.error('could not redact', error);
        return JSON.stringify(obj, null, 2);
    }
};

export function parse(logMessage: string): ParsedLogMessage | undefined {
    const match = /^\[(?<id>.*)] \[(?<level>.*)] (?<message>.*)(?<meta>[^`]*)$/gm.exec(logMessage);
    if (match) {
        const { level, id, user, app, message, meta } = match.groups!;
        return { level, id, user, app, message, meta: JSON.parse(meta) };
    }
}

export class Logger {
    public readonly app: string;
    private readonly correlationIds: CorrelationIds;
    private readonly originalLevel: Level;
    private enrichedMeta: Meta = {};
    private readonly winstonLogger: winston.Logger;

    constructor(public options: LoggerOptions) {
        if (options?.level !== 'silent') {
            console.debug(
                `new logger: ${options.name || '[missing]'}`,
                JSON.stringify({
                    ...pick(options, ['level', 'defaultMeta']),
                    correlationIds: options.correlationIds?.toObject(),
                })
            );
        }

        const { app, level = 'info', correlationIds = globalCorrelationIds } = options;

        this.app = app;
        this.correlationIds = correlationIds;
        this.originalLevel = level as Level;
        this.winstonLogger = winston.createLogger(this.createWinstonLoggerOptions(options));

        if (options.level == 'debug' || this.correlationIds.debugLogging) {
            this.enableDebug();
        }
    }

    public get level() {
        return this.winstonLogger.level as Level;
    }

    public set level(level: Level) {
        this.winstonLogger.level = level;
    }

    public enableDebug() {
        this.level = 'debug';
        return () => this.reset();
    }

    public reset() {
        this.level = this.originalLevel;
        this.enrichedMeta = {};
    }

    private createWinstonLoggerOptions(options: LoggerOptions): winston.LoggerOptions {
        const { app, nodeEnv, level, transports, defaultMeta, cloudWatch, sentryDsn } = options;
        return {
            level,
            format: this.getDefaultLogFormat({
                app,
                defaultMeta,
                cloudWatch,
            }),
            transports: [
                Logger.getConsoleTransport(),
                ...(sentryDsn ? [Logger.getSentryTransport(app, nodeEnv, sentryDsn)] : []),
                ...castArray(transports || []),
            ],
            exitOnError: false,
        };
    }

    private static getConsoleTransport() {
        return new winston.transports.Console({
            handleExceptions: true,
            debugStdout: true,
            stderrLevels: ['debug'],
        });
    }

    private static getSentryTransport(app: string, nodeEnv: string, sentryDsn: string) {
        return new SentryTransport({
            level: 'warn',
            sentry: {
                serverName: app,
                environment: nodeEnv,
                dsn: sentryDsn,
            },
        }) as any as Transport;
    }

    private getDefaultLogFormat({
        defaultMeta,
        cloudWatch,
    }: Pick<LoggerOptions, 'app' | 'defaultMeta' | 'cloudWatch'>) {
        const baseFormat = winston.format.combine(
            winston.format(info => info)(),
            winston.format.errors({ stack: true }),
            winston.format.timestamp({
                format: 'YYYY-MM-DDTHH:mm:ss',
            }),
            winston.format.printf(({ timestamp, level, message, ...meta }) => {
                // prettier-ignore
                const format = `[${this.correlationIds.id}] [${level}] ${message}
${redact({
                        ...((meta || this.enrichedMeta) && { meta: { ...meta, ...this.enrichedMeta } }),
                        ...(defaultMeta && { defaultMeta }),
                        ...(this.correlationIds.size > 0 && { correlationIds: this.correlationIds.toObject() }),
                        timestamp_utc: timestamp
                    }
                    , this.options.redact ?? [])}`;
                return cloudWatch ? format.replace(/\n/g, '\r') : format;
            })
        );

        if (!cloudWatch) {
            return winston.format.combine(baseFormat, winston.format.colorize());
        }
        return baseFormat;
    }

    public enrich(meta: Meta, options?: Partial<LoggerOptions>) {
        this.enrichedMeta = { ...this.enrichedMeta, ...meta };
        this.options = { ...this.options, ...options };
        return this;
    }

    private enumerateErrorFormat(error: Error) {
        // this solves winston issue of not being able to log Error objects since message and stack are not enumerable
        return Object.assign(
            {
                message: error.message,
                ...(axios.isAxiosError(error) && { data: error.response?.data }),
                stack: error.message,
            },
            error
        );
    }

    private logLevel(level: Level, message: string, meta?: Meta) {
        if (meta) {
            Object.keys(meta).forEach(key => {
                if (meta[key] instanceof Error) {
                    meta[key] = this.enumerateErrorFormat(meta[key]);
                }
            });
        }
        this.winstonLogger[level](message, meta);
        return this;
    }

    public debug(message: string, meta?: Meta): Logger {
        return this.logLevel('debug', message, meta);
    }

    public info(message: string, meta?: Meta): Logger {
        return this.logLevel('info', message, meta);
    }

    public warn(message: string, meta?: Meta): Logger {
        return this.logLevel('warn', message, meta);
    }

    public error(message: string, meta?: Meta): Logger {
        return this.logLevel('error', message, meta);
    }
}

export let globalLogger: Logger;

export const create = (options: LoggerOptions) => {
    globalLogger = globalLogger ?? new Logger({ name: 'global logger', ...options });
    return globalLogger;
};
