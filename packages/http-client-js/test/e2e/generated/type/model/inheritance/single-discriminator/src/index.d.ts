import { ClientOptions } from '@typespec/ts-http-runtime';
import { PathUncheckedResponse } from '@typespec/ts-http-runtime';

export declare interface Bird {
    "kind": string;
    "wingspan": number;
}

export declare function dateDeserializer(date?: string | null): Date;

export declare function dateRfc3339Serializer(date?: Date | null): string;

export declare function dateRfc7231Deserializer(date?: string | null): Date;

export declare function dateRfc7231Serializer(date?: Date | null): string;

export declare function dateUnixTimestampDeserializer(date?: number | null): Date;

export declare function dateUnixTimestampSerializer(date?: Date | null): number;

export declare function decodeBase64(value: string): Uint8Array | undefined;

export declare interface Dinosaur {
    "size": number;
    "kind": string;
}

export declare interface Eagle extends Bird {
    "kind": "eagle";
    "friends"?: Array<Bird>;
    "hate"?: Record<string, Bird>;
    "partner"?: Bird;
}

export declare function encodeUint8Array(value: Uint8Array | undefined | null, encoding: BufferEncoding): string | undefined;

declare interface GetLegacyModelOptions extends OperationOptions {
}

declare interface GetMissingDiscriminatorOptions extends OperationOptions {
}

declare interface GetModelOptions extends OperationOptions {
}

declare interface GetRecursiveModelOptions extends OperationOptions {
}

declare interface GetWrongDiscriminatorOptions extends OperationOptions {
}

export declare interface Goose extends Bird {
    "kind": "goose";
}

export declare type Int32 = number;

export declare type Int64 = bigint;

export declare type Integer = number;

export declare function jsonArrayBirdToApplicationTransform(items_?: any): Array<Bird>;

export declare function jsonArrayBirdToTransportTransform(items_?: Array<Bird> | null): any;

export declare function jsonBirdToApplicationDiscriminator(input_?: any): Bird;

export declare function jsonBirdToApplicationTransform(input_?: any): Bird;

export declare function jsonBirdToTransportDiscriminator(input_?: Bird): any;

export declare function jsonBirdToTransportTransform(input_?: Bird | null): any;

export declare function jsonDinosaurToApplicationDiscriminator(input_?: any): Dinosaur;

export declare function jsonDinosaurToApplicationTransform(input_?: any): Dinosaur;

export declare function jsonDinosaurToTransportDiscriminator(input_?: Dinosaur): any;

export declare function jsonDinosaurToTransportTransform(input_?: Dinosaur | null): any;

export declare function jsonEagleToApplicationTransform(input_?: any): Eagle;

export declare function jsonEagleToTransportTransform(input_?: Eagle | null): any;

export declare function jsonGooseToApplicationTransform(input_?: any): Goose;

export declare function jsonGooseToTransportTransform(input_?: Goose | null): any;

export declare function jsonRecordBirdToApplicationTransform(items_?: any): Record<string, any>;

export declare function jsonRecordBirdToTransportTransform(items_?: Record<string, any> | null): any;

export declare function jsonSeaGullToApplicationTransform(input_?: any): SeaGull;

export declare function jsonSeaGullToTransportTransform(input_?: SeaGull | null): any;

export declare function jsonSparrowToApplicationTransform(input_?: any): Sparrow;

export declare function jsonSparrowToTransportTransform(input_?: Sparrow | null): any;

export declare function jsonTRexToApplicationTransform(input_?: any): TRex;

export declare function jsonTRexToTransportTransform(input_?: TRex | null): any;

export declare type Numeric = number;

declare interface OperationOptions {
    operationOptions?: {
        onResponse?: (rawResponse: PathUncheckedResponse) => void;
    };
}

declare interface PutModelOptions extends OperationOptions {
}

export declare function putModelPayloadToTransport(payload: Bird): any;

declare interface PutRecursiveModelOptions extends OperationOptions {
}

export declare function putRecursiveModelPayloadToTransport(payload: Bird): any;

export declare interface SeaGull extends Bird {
    "kind": "seagull";
}

export declare class SingleDiscriminatorClient {
    #private;
    constructor(options?: SingleDiscriminatorClientOptions);
    getModel(options?: GetModelOptions): Promise<Bird>;
    putModel(input: Bird, options?: PutModelOptions): Promise<void>;
    getRecursiveModel(options?: GetRecursiveModelOptions): Promise<Bird>;
    putRecursiveModel(input: Bird, options?: PutRecursiveModelOptions): Promise<void>;
    getMissingDiscriminator(options?: GetMissingDiscriminatorOptions): Promise<Bird>;
    getWrongDiscriminator(options?: GetWrongDiscriminatorOptions): Promise<Bird>;
    getLegacyModel(options?: GetLegacyModelOptions): Promise<Dinosaur>;
}

declare interface SingleDiscriminatorClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare interface Sparrow extends Bird {
    "kind": "sparrow";
}

declare type String_2 = string;
export { String_2 as String }

export declare interface TRex extends Dinosaur {
    "kind": "t-rex";
}

export { }
