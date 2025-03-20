import { ClientOptions } from '@typespec/ts-http-runtime';
import { PathUncheckedResponse } from '@typespec/ts-http-runtime';

export declare class BasicClient {
    #private;
    constructor(options?: BasicClientOptions);
    send(options?: SendOptions): Promise<void>;
    receive(options?: ReceiveOptions): Promise<string>;
}

declare interface BasicClientOptions extends ClientOptions {
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

export declare function jsonJsonlStreamToApplicationTransform(input_?: any): JsonlStream;

export declare function jsonJsonlStreamToTransportTransform(input_?: JsonlStream | null): any;

export declare interface JsonlStream {
    "contentType": "application/jsonl";
    "body": string;
}

declare interface OperationOptions {
    operationOptions?: {
        onResponse?: (rawResponse: PathUncheckedResponse) => void;
    };
}

declare interface ReceiveOptions extends OperationOptions {
}

declare interface SendOptions extends OperationOptions {
    contentType?: "application/jsonl";
}

export declare function sendPayloadToTransport(payload: string): string;

declare type String_2 = string;
export { String_2 as String }

export { }
