import { ClientOptions } from '@typespec/ts-http-runtime';
import { PathUncheckedResponse } from '@typespec/ts-http-runtime';

export declare class AddedClient {
    #private;
    interfaceV2Client: InterfaceV2Client;
    constructor(endpoint: string, version: Versions, options?: AddedClientOptions);
    v1(body: ModelV1, headerV2: string, options?: V1Options): Promise<ModelV1>;
    v2(body: ModelV2, options?: V2Options): Promise<ModelV2>;
}

declare interface AddedClientOptions extends ClientOptions {
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

export declare enum EnumV1 {
    EnumMemberV1 = "enumMemberV1",
    EnumMemberV2 = "enumMemberV2"
}

export declare enum EnumV2 {
    EnumMember = "enumMember"
}

export declare type Int32 = number;

export declare type Int64 = bigint;

export declare type Integer = number;

export declare class InterfaceV2Client {
    #private;
    constructor(endpoint: string, version: Versions, options?: InterfaceV2ClientOptions);
    v2InInterface(body: ModelV2, options?: V2InInterfaceOptions): Promise<ModelV2>;
}

declare interface InterfaceV2ClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare function jsonModelV1ToApplicationTransform(input_?: any): ModelV1;

export declare function jsonModelV1ToTransportTransform(input_?: ModelV1 | null): any;

export declare function jsonModelV2ToApplicationTransform(input_?: any): ModelV2;

export declare function jsonModelV2ToTransportTransform(input_?: ModelV2 | null): any;

export declare function jsonUnionV1ToApplicationTransform(input_?: any): UnionV1;

export declare function jsonUnionV1ToTransportTransform(input_?: UnionV1 | null): any;

export declare function jsonUnionV2ToApplicationTransform(input_?: any): UnionV2;

export declare function jsonUnionV2ToTransportTransform(input_?: UnionV2 | null): any;

export declare interface ModelV1 {
    "prop": string;
    "enumProp": EnumV1;
    "unionProp": UnionV1;
}

export declare interface ModelV2 {
    "prop": string;
    "enumProp": EnumV2;
    "unionProp": UnionV2;
}

export declare type Numeric = number;

declare interface OperationOptions {
    operationOptions?: {
        onResponse?: (rawResponse: PathUncheckedResponse) => void;
    };
}

declare type String_2 = string;
export { String_2 as String }

export declare type UnionV1 = string | number;

export declare type UnionV2 = string | number;

export declare type Url = string;

declare interface V1Options extends OperationOptions {
}

export declare function v1PayloadToTransport(payload: ModelV1): any;

declare interface V2InInterfaceOptions extends OperationOptions {
}

export declare function v2InInterfacePayloadToTransport(payload: ModelV2): any;

declare interface V2Options extends OperationOptions {
}

export declare function v2PayloadToTransport(payload: ModelV2): any;

export declare type V2Scalar = number;

export declare enum Versions {
    V1 = "v1",
    V2 = "v2"
}

export { }
