import { ClientOptions } from '@typespec/ts-http-runtime';
import { PathUncheckedResponse } from '@typespec/ts-http-runtime';

declare interface CreateResourceOptions extends OperationOptions {
}

export declare function createResourcePayloadToTransport(payload: Resource): any;

export declare function dateDeserializer(date?: string | null): Date;

export declare function dateRfc3339Serializer(date?: Date | null): string;

export declare function dateRfc7231Deserializer(date?: string | null): Date;

export declare function dateRfc7231Serializer(date?: Date | null): string;

export declare function dateUnixTimestampDeserializer(date?: number | null): Date;

export declare function dateUnixTimestampSerializer(date?: Date | null): number;

export declare function decodeBase64(value: string): Uint8Array | undefined;

export declare function encodeUint8Array(value: Uint8Array | undefined | null, encoding: BufferEncoding): string | undefined;

export declare type Float = number;

export declare type Float32 = number;

export declare type Float64 = number;

export declare interface InnerModel {
    "name"?: string;
    "description"?: string;
}

export declare type Int32 = number;

export declare type Int64 = bigint;

export declare type Integer = number;

export declare function jsonArrayInnerModelToApplicationTransform(items_?: any): Array<InnerModel>;

export declare function jsonArrayInnerModelToTransportTransform(items_?: Array<InnerModel> | null): any;

export declare function jsonArrayInt32ToApplicationTransform(items_?: any): Array<number>;

export declare function jsonArrayInt32ToTransportTransform(items_?: Array<number> | null): any;

export declare function jsonInnerModelToApplicationTransform(input_?: any): InnerModel;

export declare function jsonInnerModelToTransportTransform(input_?: InnerModel | null): any;

export declare class JsonMergePatchClient {
    #private;
    constructor(options?: JsonMergePatchClientOptions);
    createResource(body: Resource, options?: CreateResourceOptions): Promise<Resource>;
    updateResource(body: ResourcePatch, options?: UpdateResourceOptions): Promise<Resource>;
    updateOptionalResource(options?: UpdateOptionalResourceOptions): Promise<Resource>;
}

declare interface JsonMergePatchClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare function jsonRecordInnerModelToApplicationTransform(items_?: any): Record<string, any>;

export declare function jsonRecordInnerModelToTransportTransform(items_?: Record<string, any> | null): any;

export declare function jsonResourcePatchToApplicationTransform(input_?: any): ResourcePatch;

export declare function jsonResourcePatchToTransportTransform(input_?: ResourcePatch | null): any;

export declare function jsonResourceToApplicationTransform(input_?: any): Resource;

export declare function jsonResourceToTransportTransform(input_?: Resource | null): any;

export declare type Numeric = number;

declare interface OperationOptions {
    operationOptions?: {
        onResponse?: (rawResponse: PathUncheckedResponse) => void;
    };
}

export declare interface Resource {
    "name": string;
    "description"?: string;
    "map"?: Record<string, InnerModel>;
    "array"?: Array<InnerModel>;
    "intValue"?: number;
    "floatValue"?: number;
    "innerModel"?: InnerModel;
    "intArray"?: Array<number>;
}

export declare interface ResourcePatch {
    "description"?: string;
    "map"?: Record<string, InnerModel>;
    "array"?: Array<InnerModel>;
    "intValue"?: number;
    "floatValue"?: number;
    "innerModel"?: InnerModel;
    "intArray"?: Array<number>;
}

declare type String_2 = string;
export { String_2 as String }

declare interface UpdateOptionalResourceOptions extends OperationOptions {
    contentType?: "application/merge-patch+json";
    body?: ResourcePatch;
}

export declare function updateOptionalResourcePayloadToTransport(payload: ResourcePatch): any;

declare interface UpdateResourceOptions extends OperationOptions {
    contentType?: "application/merge-patch+json";
}

export declare function updateResourcePayloadToTransport(payload: ResourcePatch): any;

export { }
