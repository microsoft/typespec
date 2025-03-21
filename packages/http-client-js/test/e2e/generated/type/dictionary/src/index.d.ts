import { ClientOptions } from '@typespec/ts-http-runtime';
import { PathUncheckedResponse } from '@typespec/ts-http-runtime';

declare type Boolean_2 = boolean;
export { Boolean_2 as Boolean }

export declare class BooleanValueClient {
    #private;
    constructor(options?: BooleanValueClientOptions);
    get(options?: GetOptions_3): Promise<Record<string, boolean>>;
    put(body: Record<string, boolean>, options?: PutOptions_3): Promise<void>;
}

declare interface BooleanValueClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare function dateDeserializer(date?: string | null): Date;

export declare function dateRfc3339Serializer(date?: Date | null): string;

export declare function dateRfc7231Deserializer(date?: string | null): Date;

export declare function dateRfc7231Serializer(date?: Date | null): string;

export declare class DatetimeValueClient {
    #private;
    constructor(options?: DatetimeValueClientOptions);
    get(options?: GetOptions_6): Promise<Record<string, Date>>;
    put(body: Record<string, Date>, options?: PutOptions_6): Promise<void>;
}

declare interface DatetimeValueClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare function dateUnixTimestampDeserializer(date?: number | null): Date;

export declare function dateUnixTimestampSerializer(date?: Date | null): number;

export declare function decodeBase64(value: string): Uint8Array | undefined;

export declare class DictionaryClient {
    #private;
    dictionaryOperationsClient: DictionaryOperationsClient;
    int32ValueClient: Int32ValueClient;
    int64ValueClient: Int64ValueClient;
    booleanValueClient: BooleanValueClient;
    stringValueClient: StringValueClient;
    float32ValueClient: Float32ValueClient;
    datetimeValueClient: DatetimeValueClient;
    durationValueClient: DurationValueClient;
    unknownValueClient: UnknownValueClient;
    modelValueClient: ModelValueClient;
    recursiveModelValueClient: RecursiveModelValueClient;
    nullableFloatValueClient: NullableFloatValueClient;
    constructor(options?: DictionaryClientOptions);
}

declare interface DictionaryClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare class DictionaryOperationsClient {
    #private;
    constructor(options?: DictionaryOperationsClientOptions);
}

declare interface DictionaryOperationsClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare type Duration = string;

export declare class DurationValueClient {
    #private;
    constructor(options?: DurationValueClientOptions);
    get(options?: GetOptions_7): Promise<Record<string, string>>;
    put(body: Record<string, string>, options?: PutOptions_7): Promise<void>;
}

declare interface DurationValueClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare function encodeUint8Array(value: Uint8Array | undefined | null, encoding: BufferEncoding): string | undefined;

export declare type Float = number;

export declare type Float32 = number;

export declare class Float32ValueClient {
    #private;
    constructor(options?: Float32ValueClientOptions);
    get(options?: GetOptions_5): Promise<Record<string, number>>;
    put(body: Record<string, number>, options?: PutOptions_5): Promise<void>;
}

declare interface Float32ValueClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare type Float64 = number;

declare interface GetOptions extends OperationOptions {
}

declare interface GetOptions_10 extends OperationOptions {
}

declare interface GetOptions_11 extends OperationOptions {
}

declare interface GetOptions_2 extends OperationOptions {
}

declare interface GetOptions_3 extends OperationOptions {
}

declare interface GetOptions_4 extends OperationOptions {
}

declare interface GetOptions_5 extends OperationOptions {
}

declare interface GetOptions_6 extends OperationOptions {
}

declare interface GetOptions_7 extends OperationOptions {
}

declare interface GetOptions_8 extends OperationOptions {
}

declare interface GetOptions_9 extends OperationOptions {
}

export declare interface InnerModel {
    "property": string;
    "children"?: Record<string, InnerModel>;
}

export declare type Int32 = number;

export declare class Int32ValueClient {
    #private;
    constructor(options?: Int32ValueClientOptions);
    get(options?: GetOptions): Promise<Record<string, number>>;
    put(body: Record<string, number>, options?: PutOptions): Promise<void>;
}

declare interface Int32ValueClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare type Int64 = bigint;

export declare class Int64ValueClient {
    #private;
    constructor(options?: Int64ValueClientOptions);
    get(options?: GetOptions_2): Promise<Record<string, bigint>>;
    put(body: Record<string, bigint>, options?: PutOptions_2): Promise<void>;
}

declare interface Int64ValueClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare type Integer = number;

export declare function jsonInnerModelToApplicationTransform(input_?: any): InnerModel;

export declare function jsonInnerModelToTransportTransform(input_?: InnerModel | null): any;

export declare function jsonRecordBooleanToApplicationTransform(items_?: any): Record<string, any>;

export declare function jsonRecordBooleanToTransportTransform(items_?: Record<string, any> | null): any;

export declare function jsonRecordDurationToApplicationTransform(items_?: any): Record<string, any>;

export declare function jsonRecordDurationToTransportTransform(items_?: Record<string, any> | null): any;

export declare function jsonRecordElementToApplicationTransform(items_?: any): Record<string, any>;

export declare function jsonRecordElementToTransportTransform(items_?: Record<string, any> | null): any;

export declare function jsonRecordFloat32ToApplicationTransform(items_?: any): Record<string, any>;

export declare function jsonRecordFloat32ToTransportTransform(items_?: Record<string, any> | null): any;

export declare function jsonRecordInnerModelToApplicationTransform(items_?: any): Record<string, any>;

export declare function jsonRecordInnerModelToTransportTransform(items_?: Record<string, any> | null): any;

export declare function jsonRecordInt32ToApplicationTransform(items_?: any): Record<string, any>;

export declare function jsonRecordInt32ToTransportTransform(items_?: Record<string, any> | null): any;

export declare function jsonRecordInt64ToApplicationTransform(items_?: any): Record<string, any>;

export declare function jsonRecordInt64ToTransportTransform(items_?: Record<string, any> | null): any;

export declare function jsonRecordStringToApplicationTransform(items_?: any): Record<string, any>;

export declare function jsonRecordStringToTransportTransform(items_?: Record<string, any> | null): any;

export declare function jsonRecordUnknownToApplicationTransform(items_?: any): Record<string, any>;

export declare function jsonRecordUnknownToTransportTransform(items_?: Record<string, any> | null): any;

export declare function jsonRecordUtcDateTimeToApplicationTransform(items_?: any): Record<string, any>;

export declare function jsonRecordUtcDateTimeToTransportTransform(items_?: Record<string, any> | null): any;

export declare class ModelValueClient {
    #private;
    constructor(options?: ModelValueClientOptions);
    get(options?: GetOptions_9): Promise<Record<string, InnerModel>>;
    put(body: Record<string, InnerModel>, options?: PutOptions_9): Promise<void>;
}

declare interface ModelValueClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare class NullableFloatValueClient {
    #private;
    constructor(options?: NullableFloatValueClientOptions);
    get(options?: GetOptions_11): Promise<Record<string, number>>;
    put(body: Record<string, number | null>, options?: PutOptions_11): Promise<void>;
}

declare interface NullableFloatValueClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare type Numeric = number;

declare interface OperationOptions {
    operationOptions?: {
        onResponse?: (rawResponse: PathUncheckedResponse) => void;
    };
}

declare interface PutOptions extends OperationOptions {
}

declare interface PutOptions_10 extends OperationOptions {
}

declare interface PutOptions_11 extends OperationOptions {
}

declare interface PutOptions_2 extends OperationOptions {
}

declare interface PutOptions_3 extends OperationOptions {
}

declare interface PutOptions_4 extends OperationOptions {
}

declare interface PutOptions_5 extends OperationOptions {
}

declare interface PutOptions_6 extends OperationOptions {
}

declare interface PutOptions_7 extends OperationOptions {
}

declare interface PutOptions_8 extends OperationOptions {
}

declare interface PutOptions_9 extends OperationOptions {
}

export declare function putPayloadToTransport(payload: Record<string, number | null>): any;

export declare function putPayloadToTransport_10(payload: Record<string, bigint>): any;

export declare function putPayloadToTransport_11(payload: Record<string, number>): any;

export declare function putPayloadToTransport_2(payload: Record<string, InnerModel>): any;

export declare function putPayloadToTransport_3(payload: Record<string, InnerModel>): any;

export declare function putPayloadToTransport_4(payload: Record<string, unknown>): any;

export declare function putPayloadToTransport_5(payload: Record<string, string>): any;

export declare function putPayloadToTransport_6(payload: Record<string, Date>): any;

export declare function putPayloadToTransport_7(payload: Record<string, number>): any;

export declare function putPayloadToTransport_8(payload: Record<string, string>): any;

export declare function putPayloadToTransport_9(payload: Record<string, boolean>): any;

export declare class RecursiveModelValueClient {
    #private;
    constructor(options?: RecursiveModelValueClientOptions);
    get(options?: GetOptions_10): Promise<Record<string, InnerModel>>;
    put(body: Record<string, InnerModel>, options?: PutOptions_10): Promise<void>;
}

declare interface RecursiveModelValueClientOptions extends ClientOptions {
    endpoint?: string;
}

declare type String_2 = string;
export { String_2 as String }

export declare class StringValueClient {
    #private;
    constructor(options?: StringValueClientOptions);
    get(options?: GetOptions_4): Promise<Record<string, string>>;
    put(body: Record<string, string>, options?: PutOptions_4): Promise<void>;
}

declare interface StringValueClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare class UnknownValueClient {
    #private;
    constructor(options?: UnknownValueClientOptions);
    get(options?: GetOptions_8): Promise<Record<string, unknown>>;
    put(body: Record<string, unknown>, options?: PutOptions_8): Promise<void>;
}

declare interface UnknownValueClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare type UtcDateTime = Date;

export { }
