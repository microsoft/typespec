import { ClientOptions } from '@typespec/ts-http-runtime';
import { PathUncheckedResponse } from '@typespec/ts-http-runtime';

export declare function dateDeserializer(date?: string | null): Date;

export declare function dateRfc3339Serializer(date?: Date | null): string;

export declare function dateRfc7231Deserializer(date?: string | null): Date;

export declare function dateRfc7231Serializer(date?: Date | null): string;

export declare function dateUnixTimestampDeserializer(date?: number | null): Date;

export declare function dateUnixTimestampSerializer(date?: Date | null): number;

export declare function decodeBase64(value: string): Uint8Array | undefined;

export declare function encodeUint8Array(value: Uint8Array | undefined | null, encoding: BufferEncoding): string | undefined;

export declare class NotVersionedClient {
    #private;
    constructor(endpoint: string, options?: NotVersionedClientOptions);
    withoutApiVersion(options?: WithoutApiVersionOptions): Promise<void>;
    withQueryApiVersion(apiVersion: string, options?: WithQueryApiVersionOptions): Promise<void>;
    withPathApiVersion(apiVersion: string, options?: WithPathApiVersionOptions): Promise<void>;
}

declare interface NotVersionedClientOptions extends ClientOptions {
    endpoint?: string;
}

declare interface OperationOptions {
    operationOptions?: {
        onResponse?: (rawResponse: PathUncheckedResponse) => void;
    };
}

declare type String_2 = string;
export { String_2 as String }

export declare type Url = string;

declare interface WithoutApiVersionOptions extends OperationOptions {
}

declare interface WithPathApiVersionOptions extends OperationOptions {
}

declare interface WithQueryApiVersionOptions extends OperationOptions {
}

export { }
