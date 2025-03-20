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

declare interface ErrorResponseStatusCode404Options extends OperationOptions {
}

declare interface ErrorResponseStatusCodeInRangeOptions extends OperationOptions {
}

declare interface OperationOptions {
    operationOptions?: {
        onResponse?: (rawResponse: PathUncheckedResponse) => void;
    };
}

export declare class StatusCodeRangeClient {
    #private;
    constructor(options?: StatusCodeRangeClientOptions);
    errorResponseStatusCodeInRange(options?: ErrorResponseStatusCodeInRangeOptions): Promise<204>;
    errorResponseStatusCode404(options?: ErrorResponseStatusCode404Options): Promise<204>;
}

declare interface StatusCodeRangeClientOptions extends ClientOptions {
    endpoint?: string;
}

declare type String_2 = string;
export { String_2 as String }

export { }
