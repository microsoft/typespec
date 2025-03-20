import { ClientOptions } from '@typespec/ts-http-runtime';
import { PathUncheckedResponse } from '@typespec/ts-http-runtime';

export declare interface Cobra extends Snake {
    "kind": SnakeKind.Cobra;
}

export declare function dateDeserializer(date?: string | null): Date;

export declare function dateRfc3339Serializer(date?: Date | null): string;

export declare function dateRfc7231Deserializer(date?: string | null): Date;

export declare function dateRfc7231Serializer(date?: Date | null): string;

export declare function dateUnixTimestampDeserializer(date?: number | null): Date;

export declare function dateUnixTimestampSerializer(date?: Date | null): number;

export declare function decodeBase64(value: string): Uint8Array | undefined;

export declare interface Dog {
    "kind": string;
    "weight": number;
}

export declare type DogKind = string | "golden";

export declare function encodeUint8Array(value: Uint8Array | undefined | null, encoding: BufferEncoding): string | undefined;

export declare class EnumDiscriminatorClient {
    #private;
    constructor(options?: EnumDiscriminatorClientOptions);
    getExtensibleModel(options?: GetExtensibleModelOptions): Promise<Dog>;
    putExtensibleModel(input: Dog, options?: PutExtensibleModelOptions): Promise<void>;
    getExtensibleModelMissingDiscriminator(options?: GetExtensibleModelMissingDiscriminatorOptions): Promise<Dog>;
    getExtensibleModelWrongDiscriminator(options?: GetExtensibleModelWrongDiscriminatorOptions): Promise<Dog>;
    getFixedModel(options?: GetFixedModelOptions): Promise<Snake>;
    putFixedModel(input: Snake, options?: PutFixedModelOptions): Promise<void>;
    getFixedModelMissingDiscriminator(options?: GetFixedModelMissingDiscriminatorOptions): Promise<Snake>;
    getFixedModelWrongDiscriminator(options?: GetFixedModelWrongDiscriminatorOptions): Promise<Snake>;
}

declare interface EnumDiscriminatorClientOptions extends ClientOptions {
    endpoint?: string;
}

declare interface GetExtensibleModelMissingDiscriminatorOptions extends OperationOptions {
}

declare interface GetExtensibleModelOptions extends OperationOptions {
}

declare interface GetExtensibleModelWrongDiscriminatorOptions extends OperationOptions {
}

declare interface GetFixedModelMissingDiscriminatorOptions extends OperationOptions {
}

declare interface GetFixedModelOptions extends OperationOptions {
}

declare interface GetFixedModelWrongDiscriminatorOptions extends OperationOptions {
}

export declare interface Golden extends Dog {
    "kind": "golden";
}

export declare type Int32 = number;

export declare type Int64 = bigint;

export declare type Integer = number;

export declare function jsonCobraToApplicationTransform(input_?: any): Cobra;

export declare function jsonCobraToTransportTransform(input_?: Cobra | null): any;

export declare function jsonDogKindToApplicationTransform(input_?: any): DogKind;

export declare function jsonDogKindToTransportTransform(input_?: DogKind | null): any;

export declare function jsonDogToApplicationDiscriminator(input_?: any): Dog;

export declare function jsonDogToApplicationTransform(input_?: any): Dog;

export declare function jsonDogToTransportDiscriminator(input_?: Dog): any;

export declare function jsonDogToTransportTransform(input_?: Dog | null): any;

export declare function jsonGoldenToApplicationTransform(input_?: any): Golden;

export declare function jsonGoldenToTransportTransform(input_?: Golden | null): any;

export declare function jsonSnakeToApplicationDiscriminator(input_?: any): Snake;

export declare function jsonSnakeToApplicationTransform(input_?: any): Snake;

export declare function jsonSnakeToTransportDiscriminator(input_?: Snake): any;

export declare function jsonSnakeToTransportTransform(input_?: Snake | null): any;

export declare type Numeric = number;

declare interface OperationOptions {
    operationOptions?: {
        onResponse?: (rawResponse: PathUncheckedResponse) => void;
    };
}

declare interface PutExtensibleModelOptions extends OperationOptions {
}

export declare function putExtensibleModelPayloadToTransport(payload: Dog): any;

declare interface PutFixedModelOptions extends OperationOptions {
}

export declare function putFixedModelPayloadToTransport(payload: Snake): any;

export declare interface Snake {
    "kind": string;
    "length": number;
}

export declare enum SnakeKind {
    Cobra = "cobra"
}

declare type String_2 = string;
export { String_2 as String }

export { }
