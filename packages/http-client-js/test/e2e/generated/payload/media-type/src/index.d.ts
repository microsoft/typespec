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

declare interface GetAsJsonOptions extends OperationOptions {
}

declare interface GetAsTextOptions extends OperationOptions {
}

declare interface OperationOptions {
    operationOptions?: {
        onResponse?: (rawResponse: PathUncheckedResponse) => void;
    };
}

declare interface SendAsJsonOptions extends OperationOptions {
    contentType?: "application/json";
}

export declare function sendAsJsonPayloadToTransport(payload: string): string;

declare interface SendAsTextOptions extends OperationOptions {
    contentType?: "text/plain";
}

export declare function sendAsTextPayloadToTransport(payload: string): string;

declare type String_2 = string;
export { String_2 as String }

export declare class StringBodyClient {
    #private;
    constructor(options?: StringBodyClientOptions);
    sendAsText(text: string, options?: SendAsTextOptions): Promise<void>;
    getAsText(options?: GetAsTextOptions): Promise<string>;
    sendAsJson(text: string, options?: SendAsJsonOptions): Promise<void>;
    getAsJson(options?: GetAsJsonOptions): Promise<string>;
}

declare interface StringBodyClientOptions extends ClientOptions {
    endpoint?: string;
}

export { }
