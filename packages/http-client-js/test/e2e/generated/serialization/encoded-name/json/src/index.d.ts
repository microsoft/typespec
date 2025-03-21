import { ClientOptions } from '@typespec/ts-http-runtime';
import { PathUncheckedResponse } from '@typespec/ts-http-runtime';

declare type Boolean_2 = boolean;
export { Boolean_2 as Boolean }

export declare function dateDeserializer(date?: string | null): Date;

export declare function dateRfc3339Serializer(date?: Date | null): string;

export declare function dateRfc7231Deserializer(date?: string | null): Date;

export declare function dateRfc7231Serializer(date?: Date | null): string;

export declare function dateUnixTimestampDeserializer(date?: number | null): Date;

export declare function dateUnixTimestampSerializer(date?: Date | null): number;

export declare function decodeBase64(value: string): Uint8Array | undefined;

export declare function encodeUint8Array(value: Uint8Array | undefined | null, encoding: BufferEncoding): string | undefined;

declare interface GetOptions extends OperationOptions {
}

export declare interface JsonEncodedNameModel {
    "defaultName": boolean;
}

export declare function jsonJsonEncodedNameModelToApplicationTransform(input_?: any): JsonEncodedNameModel;

export declare function jsonJsonEncodedNameModelToTransportTransform(input_?: JsonEncodedNameModel | null): any;

declare interface OperationOptions {
    operationOptions?: {
        onResponse?: (rawResponse: PathUncheckedResponse) => void;
    };
}

export declare class PropertyClient {
    #private;
    constructor(options?: PropertyClientOptions);
    send(body: JsonEncodedNameModel, options?: SendOptions): Promise<void>;
    get(options?: GetOptions): Promise<JsonEncodedNameModel>;
}

declare interface PropertyClientOptions extends ClientOptions {
    endpoint?: string;
}

declare interface SendOptions extends OperationOptions {
}

export declare function sendPayloadToTransport(payload: JsonEncodedNameModel): any;

declare type String_2 = string;
export { String_2 as String }

export { }
