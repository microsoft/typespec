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

export declare type Int64 = bigint;

export declare type Integer = number;

export declare function jsonSafeintAsStringPropertyToApplicationTransform(input_?: any): SafeintAsStringProperty;

export declare function jsonSafeintAsStringPropertyToTransportTransform(input_?: SafeintAsStringProperty | null): any;

export declare function jsonUint32AsStringPropertyToApplicationTransform(input_?: any): Uint32AsStringProperty;

export declare function jsonUint32AsStringPropertyToTransportTransform(input_?: Uint32AsStringProperty | null): any;

export declare function jsonUint8AsStringPropertyToApplicationTransform(input_?: any): Uint8AsStringProperty;

export declare function jsonUint8AsStringPropertyToTransportTransform(input_?: Uint8AsStringProperty | null): any;

export declare type Numeric = number;

declare interface OperationOptions {
    operationOptions?: {
        onResponse?: (rawResponse: PathUncheckedResponse) => void;
    };
}

export declare class PropertyClient {
    #private;
    sendIntAsStringClient: SendIntAsStringClient;
    constructor(options?: PropertyClientOptions);
    safeintAsString(value: SafeintAsStringProperty, options?: SafeintAsStringOptions): Promise<SafeintAsStringProperty>;
    uint32AsStringOptional(value: Uint32AsStringProperty, options?: Uint32AsStringOptionalOptions): Promise<Uint32AsStringProperty>;
    uint8AsString(value: Uint8AsStringProperty, options?: Uint8AsStringOptions): Promise<Uint8AsStringProperty>;
}

declare interface PropertyClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare type Safeint = number;

declare interface SafeintAsStringOptions extends OperationOptions {
}

export declare function safeintAsStringPayloadToTransport(payload: SafeintAsStringProperty): any;

export declare interface SafeintAsStringProperty {
    "value": number;
}

export declare class SendIntAsStringClient {
    #private;
    constructor(options?: SendIntAsStringClientOptions);
}

declare interface SendIntAsStringClientOptions extends ClientOptions {
    endpoint?: string;
}

declare type String_2 = string;
export { String_2 as String }

export declare type Uint16 = number;

export declare type Uint32 = number;

declare interface Uint32AsStringOptionalOptions extends OperationOptions {
}

export declare function uint32AsStringOptionalPayloadToTransport(payload: Uint32AsStringProperty): any;

export declare interface Uint32AsStringProperty {
    "value"?: number;
}

export declare type Uint64 = bigint;

export declare type Uint8 = number;

declare interface Uint8AsStringOptions extends OperationOptions {
}

export declare function uint8AsStringPayloadToTransport(payload: Uint8AsStringProperty): any;

export declare interface Uint8AsStringProperty {
    "value": number;
}

export { }
