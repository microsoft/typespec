import { ClientOptions } from '@typespec/ts-http-runtime';
import { PathUncheckedResponse } from '@typespec/ts-http-runtime';

export declare function dateDeserializer(date?: string | null): Date;

export declare function dateRfc3339Serializer(date?: Date | null): string;

export declare function dateRfc7231Deserializer(date?: string | null): Date;

export declare function dateRfc7231Serializer(date?: Date | null): string;

export declare function dateUnixTimestampDeserializer(date?: number | null): Date;

export declare function dateUnixTimestampSerializer(date?: Date | null): number;

export declare function decodeBase64(value: string): Uint8Array | undefined;

declare interface Element_2 {
    "extension"?: Array<Extension>;
}
export { Element_2 as Element }

export declare function encodeUint8Array(value: Uint8Array | undefined | null, encoding: BufferEncoding): string | undefined;

export declare interface Extension extends Element_2 {
    "level": number;
}

declare interface GetOptions extends OperationOptions {
}

export declare type Int16 = number;

export declare type Int32 = number;

export declare type Int64 = bigint;

export declare type Int8 = number;

export declare type Integer = number;

export declare function jsonArrayExtensionToApplicationTransform(items_?: any): Array<Extension>;

export declare function jsonArrayExtensionToTransportTransform(items_?: Array<Extension> | null): any;

export declare function jsonElementToApplicationTransform(input_?: any): Element_2;

export declare function jsonElementToTransportTransform(input_?: Element_2 | null): any;

export declare function jsonExtensionToApplicationTransform(input_?: any): Extension;

export declare function jsonExtensionToTransportTransform(input_?: Extension | null): any;

export declare type Numeric = number;

declare interface OperationOptions {
    operationOptions?: {
        onResponse?: (rawResponse: PathUncheckedResponse) => void;
    };
}

declare interface PutOptions extends OperationOptions {
}

export declare function putPayloadToTransport(payload: Extension): any;

export declare class RecursiveClient {
    #private;
    constructor(options?: RecursiveClientOptions);
    put(input: Extension, options?: PutOptions): Promise<void>;
    get(options?: GetOptions): Promise<Extension>;
}

declare interface RecursiveClientOptions extends ClientOptions {
    endpoint?: string;
}

declare type String_2 = string;
export { String_2 as String }

export { }
