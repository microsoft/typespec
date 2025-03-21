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

export declare class MultipleClient {
    #private;
    constructor(endpoint: string, apiVersion: Versions, options?: MultipleClientOptions);
    noOperationParams(options?: NoOperationParamsOptions): Promise<void>;
    withOperationPathParam(keyword: string, options?: WithOperationPathParamOptions): Promise<void>;
}

declare interface MultipleClientOptions extends ClientOptions {
    endpoint?: string;
}

declare interface NoOperationParamsOptions extends OperationOptions {
}

declare interface OperationOptions {
    operationOptions?: {
        onResponse?: (rawResponse: PathUncheckedResponse) => void;
    };
}

declare type String_2 = string;
export { String_2 as String }

export declare type Url = string;

export declare enum Versions {
    V1_0 = "v1.0"
}

declare interface WithOperationPathParamOptions extends OperationOptions {
}

export { }
