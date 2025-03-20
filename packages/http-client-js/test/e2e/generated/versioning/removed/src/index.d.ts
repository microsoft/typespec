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

export declare enum EnumV1 {
    EnumMember = "enumMember"
}

export declare enum EnumV2 {
    EnumMemberV1 = "enumMemberV1",
    EnumMemberV2 = "enumMemberV2"
}

export declare enum EnumV3 {
    EnumMemberV1 = "enumMemberV1",
    EnumMemberV2Preview = "enumMemberV2Preview"
}

export declare type Float = number;

export declare type Float32 = number;

export declare type Float64 = number;

export declare type Int32 = number;

export declare type Int64 = bigint;

export declare type Integer = number;

export declare class InterfaceV1Client {
    #private;
    constructor(endpoint: string, version: Versions, options?: InterfaceV1ClientOptions);
    v1InInterface(body: ModelV1, options?: V1InInterfaceOptions): Promise<ModelV1>;
}

declare interface InterfaceV1ClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare function jsonModelV1ToApplicationTransform(input_?: any): ModelV1;

export declare function jsonModelV1ToTransportTransform(input_?: ModelV1 | null): any;

export declare function jsonModelV2ToApplicationTransform(input_?: any): ModelV2;

export declare function jsonModelV2ToTransportTransform(input_?: ModelV2 | null): any;

export declare function jsonModelV3ToApplicationTransform(input_?: any): ModelV3;

export declare function jsonModelV3ToTransportTransform(input_?: ModelV3 | null): any;

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
    "removedProp": string;
    "enumProp": EnumV2;
    "unionProp": UnionV2;
}

export declare interface ModelV3 {
    "id": string;
    "enumProp": EnumV3;
}

declare interface ModelV3Options extends OperationOptions {
}

export declare function modelV3PayloadToTransport(payload: ModelV3): any;

export declare type Numeric = number;

declare interface OperationOptions {
    operationOptions?: {
        onResponse?: (rawResponse: PathUncheckedResponse) => void;
    };
}

export declare class RemovedClient {
    #private;
    interfaceV1Client: InterfaceV1Client;
    constructor(endpoint: string, version: Versions, options?: RemovedClientOptions);
    v1(body: ModelV1, options?: V1Options): Promise<ModelV1>;
    v2(body: ModelV2, param: string, options?: V2Options): Promise<ModelV2>;
    modelV3(body: ModelV3, options?: ModelV3Options): Promise<ModelV3>;
}

declare interface RemovedClientOptions extends ClientOptions {
    endpoint?: string;
}

declare type String_2 = string;
export { String_2 as String }

export declare type UnionV1 = string | number;

export declare type UnionV2 = string | number | number;

export declare type Url = string;

declare interface V1InInterfaceOptions extends OperationOptions {
}

export declare function v1InInterfacePayloadToTransport(payload: ModelV1): any;

declare interface V1Options extends OperationOptions {
}

export declare function v1PayloadToTransport(payload: ModelV1): any;

export declare type V1Scalar = number;

declare interface V2Options extends OperationOptions {
}

export declare function v2PayloadToTransport(payload: ModelV2): any;

export declare enum Versions {
    V1 = "v1",
    V2preview = "v2preview",
    V2 = "v2"
}

export { }
