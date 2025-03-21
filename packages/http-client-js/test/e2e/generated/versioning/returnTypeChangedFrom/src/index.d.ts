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

declare interface OperationOptions {
    operationOptions?: {
        onResponse?: (rawResponse: PathUncheckedResponse) => void;
    };
}

export declare class ReturnTypeChangedFromClient {
    #private;
    constructor(endpoint: string, version: Versions, options?: ReturnTypeChangedFromClientOptions);
    test(body: string, options?: TestOptions): Promise<string>;
}

declare interface ReturnTypeChangedFromClientOptions extends ClientOptions {
    endpoint?: string;
}

declare type String_2 = string;
export { String_2 as String }

declare interface TestOptions extends OperationOptions {
}

export declare function testPayloadToTransport(payload: string): string;

export declare type Url = string;

export declare enum Versions {
    V1 = "v1",
    V2 = "v2"
}

export { }
