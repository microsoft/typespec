import { ClientOptions } from '@typespec/ts-http-runtime';
import { PathUncheckedResponse } from '@typespec/ts-http-runtime';

export declare class AliasClient {
    #private;
    constructor(options?: AliasClientOptions);
    spreadAsRequestBody(name: string, options?: SpreadAsRequestBodyOptions_2): Promise<void>;
    spreadParameterWithInnerModel(id: string, name: string, xMsTestHeader: string, options?: SpreadParameterWithInnerModelOptions): Promise<void>;
    spreadAsRequestParameter(id: string, xMsTestHeader: string, name: string, options?: SpreadAsRequestParameterOptions): Promise<void>;
    spreadWithMultipleParameters(id: string, xMsTestHeader: string, requiredString: string, requiredIntList: Array<number>, options?: SpreadWithMultipleParametersOptions): Promise<void>;
    spreadParameterWithInnerAlias(id: string, name: string, age: number, xMsTestHeader: string, options?: SpreadParameterWithInnerAliasOptions): Promise<void>;
}

declare interface AliasClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare interface BodyParameter {
    "name": string;
}

export declare function dateDeserializer(date?: string | null): Date;

export declare function dateRfc3339Serializer(date?: Date | null): string;

export declare function dateRfc7231Deserializer(date?: string | null): Date;

export declare function dateRfc7231Serializer(date?: Date | null): string;

export declare function dateUnixTimestampDeserializer(date?: number | null): Date;

export declare function dateUnixTimestampSerializer(date?: Date | null): number;

export declare function decodeBase64(value: string): Uint8Array | undefined;

export declare function encodeUint8Array(value: Uint8Array | undefined | null, encoding: BufferEncoding): string | undefined;

export declare type Int32 = number;

export declare type Int64 = bigint;

export declare type Integer = number;

export declare function jsonArrayInt32ToApplicationTransform(items_?: any): Array<number>;

export declare function jsonArrayInt32ToTransportTransform(items_?: Array<number> | null): any;

export declare function jsonArrayStringToApplicationTransform(items_?: any): Array<string>;

export declare function jsonArrayStringToTransportTransform(items_?: Array<string> | null): any;

export declare function jsonBodyParameterToApplicationTransform(input_?: any): BodyParameter;

export declare function jsonBodyParameterToTransportTransform(input_?: BodyParameter | null): any;

export declare class ModelClient {
    #private;
    constructor(options?: ModelClientOptions);
    spreadAsRequestBody(name: string, options?: SpreadAsRequestBodyOptions): Promise<void>;
    spreadCompositeRequestOnlyWithBody(body: BodyParameter, options?: SpreadCompositeRequestOnlyWithBodyOptions): Promise<void>;
    spreadCompositeRequestWithoutBody(name: string, testHeader: string, options?: SpreadCompositeRequestWithoutBodyOptions): Promise<void>;
    spreadCompositeRequest(name: string, testHeader: string, body: BodyParameter, options?: SpreadCompositeRequestOptions): Promise<void>;
    spreadCompositeRequestMix(name: string, testHeader: string, prop: string, options?: SpreadCompositeRequestMixOptions): Promise<void>;
}

declare interface ModelClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare type Numeric = number;

declare interface OperationOptions {
    operationOptions?: {
        onResponse?: (rawResponse: PathUncheckedResponse) => void;
    };
}

declare interface SpreadAsRequestBodyOptions extends OperationOptions {
}

declare interface SpreadAsRequestBodyOptions_2 extends OperationOptions {
}

declare interface SpreadAsRequestParameterOptions extends OperationOptions {
}

export declare class SpreadClient {
    #private;
    modelClient: ModelClient;
    aliasClient: AliasClient;
    constructor(options?: SpreadClientOptions);
}

declare interface SpreadClientOptions extends ClientOptions {
    endpoint?: string;
}

declare interface SpreadCompositeRequestMixOptions extends OperationOptions {
}

declare interface SpreadCompositeRequestOnlyWithBodyOptions extends OperationOptions {
}

export declare function spreadCompositeRequestOnlyWithBodyPayloadToTransport(payload: BodyParameter): any;

declare interface SpreadCompositeRequestOptions extends OperationOptions {
}

export declare function spreadCompositeRequestPayloadToTransport(payload: BodyParameter): any;

declare interface SpreadCompositeRequestWithoutBodyOptions extends OperationOptions {
}

declare interface SpreadParameterWithInnerAliasOptions extends OperationOptions {
}

declare interface SpreadParameterWithInnerModelOptions extends OperationOptions {
}

declare interface SpreadWithMultipleParametersOptions extends OperationOptions {
    optionalInt?: number;
    optionalStringList?: Array<string>;
}

declare type String_2 = string;
export { String_2 as String }

export { }
