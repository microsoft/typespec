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

export declare interface Fish {
    "age": number;
    "kind": string;
}

declare interface GetMissingDiscriminatorOptions extends OperationOptions {
}

declare interface GetModelOptions extends OperationOptions {
}

declare interface GetRecursiveModelOptions extends OperationOptions {
}

declare interface GetWrongDiscriminatorOptions extends OperationOptions {
}

export declare interface GoblinShark extends Shark {
    "sharktype": "goblin";
}

export declare type Int32 = number;

export declare type Int64 = bigint;

export declare type Integer = number;

export declare function jsonArrayFishToApplicationTransform(items_?: any): Array<Fish>;

export declare function jsonArrayFishToTransportTransform(items_?: Array<Fish> | null): any;

export declare function jsonFishToApplicationDiscriminator(input_?: any): Fish;

export declare function jsonFishToApplicationTransform(input_?: any): Fish;

export declare function jsonFishToTransportDiscriminator(input_?: Fish): any;

export declare function jsonFishToTransportTransform(input_?: Fish | null): any;

export declare function jsonGoblinSharkToApplicationTransform(input_?: any): GoblinShark;

export declare function jsonGoblinSharkToTransportTransform(input_?: GoblinShark | null): any;

export declare function jsonRecordFishToApplicationTransform(items_?: any): Record<string, any>;

export declare function jsonRecordFishToTransportTransform(items_?: Record<string, any> | null): any;

export declare function jsonSalmonToApplicationTransform(input_?: any): Salmon;

export declare function jsonSalmonToTransportTransform(input_?: Salmon | null): any;

export declare function jsonSawSharkToApplicationTransform(input_?: any): SawShark;

export declare function jsonSawSharkToTransportTransform(input_?: SawShark | null): any;

export declare function jsonSharkToApplicationDiscriminator(input_?: any): Shark;

export declare function jsonSharkToApplicationTransform(input_?: any): Shark;

export declare function jsonSharkToTransportDiscriminator(input_?: Shark): any;

export declare function jsonSharkToTransportTransform(input_?: Shark | null): any;

export declare class NestedDiscriminatorClient {
    #private;
    constructor(options?: NestedDiscriminatorClientOptions);
    getModel(options?: GetModelOptions): Promise<Fish>;
    putModel(input: Fish, options?: PutModelOptions): Promise<void>;
    getRecursiveModel(options?: GetRecursiveModelOptions): Promise<Fish>;
    putRecursiveModel(input: Fish, options?: PutRecursiveModelOptions): Promise<void>;
    getMissingDiscriminator(options?: GetMissingDiscriminatorOptions): Promise<Fish>;
    getWrongDiscriminator(options?: GetWrongDiscriminatorOptions): Promise<Fish>;
}

declare interface NestedDiscriminatorClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare type Numeric = number;

declare interface OperationOptions {
    operationOptions?: {
        onResponse?: (rawResponse: PathUncheckedResponse) => void;
    };
}

declare interface PutModelOptions extends OperationOptions {
}

export declare function putModelPayloadToTransport(payload: Fish): any;

declare interface PutRecursiveModelOptions extends OperationOptions {
}

export declare function putRecursiveModelPayloadToTransport(payload: Fish): any;

export declare interface Salmon extends Fish {
    "kind": "salmon";
    "friends"?: Array<Fish>;
    "hate"?: Record<string, Fish>;
    "partner"?: Fish;
}

export declare interface SawShark extends Shark {
    "sharktype": "saw";
}

export declare interface Shark extends Fish {
    "kind": "shark";
    "sharktype": string;
}

declare type String_2 = string;
export { String_2 as String }

export { }
