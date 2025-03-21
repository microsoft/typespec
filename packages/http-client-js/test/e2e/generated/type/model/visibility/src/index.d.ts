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

declare interface DeleteModelOptions extends OperationOptions {
}

export declare function deleteModelPayloadToTransport(payload: VisibilityModel): any;

export declare function encodeUint8Array(value: Uint8Array | undefined | null, encoding: BufferEncoding): string | undefined;

declare interface GetModelOptions extends OperationOptions {
}

export declare function getModelPayloadToTransport(payload: VisibilityModel): any;

declare interface HeadModelOptions extends OperationOptions {
}

export declare function headModelPayloadToTransport(payload: VisibilityModel): any;

export declare type Int32 = number;

export declare type Int64 = bigint;

export declare type Integer = number;

export declare function jsonArrayInt32ToApplicationTransform(items_?: any): Array<number>;

export declare function jsonArrayInt32ToTransportTransform(items_?: Array<number> | null): any;

export declare function jsonArrayStringToApplicationTransform(items_?: any): Array<string>;

export declare function jsonArrayStringToTransportTransform(items_?: Array<string> | null): any;

export declare function jsonReadOnlyModelToApplicationTransform(input_?: any): ReadOnlyModel;

export declare function jsonReadOnlyModelToTransportTransform(input_?: ReadOnlyModel | null): any;

export declare function jsonRecordStringToApplicationTransform(items_?: any): Record<string, any>;

export declare function jsonRecordStringToTransportTransform(items_?: Record<string, any> | null): any;

export declare function jsonVisibilityModelToApplicationTransform(input_?: any): VisibilityModel;

export declare function jsonVisibilityModelToTransportTransform(input_?: VisibilityModel | null): any;

export declare type Numeric = number;

declare interface OperationOptions {
    operationOptions?: {
        onResponse?: (rawResponse: PathUncheckedResponse) => void;
    };
}

declare interface PatchModelOptions extends OperationOptions {
}

export declare function patchModelPayloadToTransport(payload: VisibilityModel): any;

declare interface PostModelOptions extends OperationOptions {
}

export declare function postModelPayloadToTransport(payload: VisibilityModel): any;

declare interface PutModelOptions extends OperationOptions {
}

export declare function putModelPayloadToTransport(payload: VisibilityModel): any;

declare interface PutReadOnlyModelOptions extends OperationOptions {
}

export declare function putReadOnlyModelPayloadToTransport(payload: ReadOnlyModel): any;

export declare interface ReadOnlyModel {
    "optionalNullableIntList"?: Array<number> | null;
    "optionalStringRecord"?: Record<string, string>;
}

declare type String_2 = string;
export { String_2 as String }

export declare class VisibilityClient {
    #private;
    constructor(options?: VisibilityClientOptions);
    getModel(input: VisibilityModel, options?: GetModelOptions): Promise<VisibilityModel>;
    headModel(input: VisibilityModel, options?: HeadModelOptions): Promise<void>;
    putModel(input: VisibilityModel, options?: PutModelOptions): Promise<void>;
    patchModel(input: VisibilityModel, options?: PatchModelOptions): Promise<void>;
    postModel(input: VisibilityModel, options?: PostModelOptions): Promise<void>;
    deleteModel(input: VisibilityModel, options?: DeleteModelOptions): Promise<void>;
    putReadOnlyModel(input: ReadOnlyModel, options?: PutReadOnlyModelOptions): Promise<ReadOnlyModel>;
}

declare interface VisibilityClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare interface VisibilityModel {
    "readProp": string;
    "queryProp": number;
    "createProp": Array<string>;
    "updateProp": Array<number>;
    "deleteProp": boolean;
    "noneProp": "none";
}

export { }
