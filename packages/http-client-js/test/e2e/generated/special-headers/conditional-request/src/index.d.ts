import { ClientOptions } from '@typespec/ts-http-runtime';
import { PathUncheckedResponse } from '@typespec/ts-http-runtime';

export declare class ConditionalRequestClient {
    #private;
    constructor(options?: ConditionalRequestClientOptions);
    postIfMatch(options?: PostIfMatchOptions): Promise<void>;
    postIfNoneMatch(options?: PostIfNoneMatchOptions): Promise<void>;
    headIfModifiedSince(options?: HeadIfModifiedSinceOptions): Promise<void>;
    postIfUnmodifiedSince(options?: PostIfUnmodifiedSinceOptions): Promise<void>;
}

declare interface ConditionalRequestClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare function dateDeserializer(date?: string | null): Date;

export declare function dateRfc3339Serializer(date?: Date | null): string;

export declare function dateRfc7231Deserializer(date?: string | null): Date;

export declare function dateRfc7231Serializer(date?: Date | null): string;

export declare function dateUnixTimestampDeserializer(date?: number | null): Date;

export declare function dateUnixTimestampSerializer(date?: Date | null): number;

export declare function decodeBase64(value: string): Uint8Array | undefined;

export declare function encodeUint8Array(value: Uint8Array | undefined | null, encoding: BufferEncoding): string | undefined;

declare interface HeadIfModifiedSinceOptions extends OperationOptions {
    ifModifiedSince?: Date;
}

declare interface OperationOptions {
    operationOptions?: {
        onResponse?: (rawResponse: PathUncheckedResponse) => void;
    };
}

declare interface PostIfMatchOptions extends OperationOptions {
    ifMatch?: string;
}

declare interface PostIfNoneMatchOptions extends OperationOptions {
    ifNoneMatch?: string;
}

declare interface PostIfUnmodifiedSinceOptions extends OperationOptions {
    ifUnmodifiedSince?: Date;
}

declare type String_2 = string;
export { String_2 as String }

export declare type UtcDateTime = Date;

export { }
