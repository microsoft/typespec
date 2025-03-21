import { ClientOptions } from '@typespec/ts-http-runtime';
import { PathUncheckedResponse } from '@typespec/ts-http-runtime';

export declare class ArrayClient {
    #private;
    arrayOperationsClient: ArrayOperationsClient;
    int32ValueClient: Int32ValueClient;
    int64ValueClient: Int64ValueClient;
    booleanValueClient: BooleanValueClient;
    stringValueClient: StringValueClient;
    float32ValueClient: Float32ValueClient;
    datetimeValueClient: DatetimeValueClient;
    durationValueClient: DurationValueClient;
    unknownValueClient: UnknownValueClient;
    modelValueClient: ModelValueClient;
    nullableFloatValueClient: NullableFloatValueClient;
    nullableInt32ValueClient: NullableInt32ValueClient;
    nullableBooleanValueClient: NullableBooleanValueClient;
    nullableStringValueClient: NullableStringValueClient;
    nullableModelValueClient: NullableModelValueClient;
    constructor(options?: ArrayClientOptions);
}

declare interface ArrayClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare class ArrayOperationsClient {
    #private;
    constructor(options?: ArrayOperationsClientOptions);
}

declare interface ArrayOperationsClientOptions extends ClientOptions {
    endpoint?: string;
}

declare type Boolean_2 = boolean;
export { Boolean_2 as Boolean }

export declare class BooleanValueClient {
    #private;
    constructor(options?: BooleanValueClientOptions);
    get(options?: GetOptions_3): Promise<boolean[]>;
    put(body: Array<boolean>, options?: PutOptions_3): Promise<void>;
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
    get(options?: GetOptions_6): Promise<Date[]>;
    put(body: Array<Date>, options?: PutOptions_6): Promise<void>;
}

declare interface DatetimeValueClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare function dateUnixTimestampDeserializer(date?: number | null): Date;

export declare function dateUnixTimestampSerializer(date?: Date | null): number;

export declare function decodeBase64(value: string): Uint8Array | undefined;

export declare type Duration = string;

export declare class DurationValueClient {
    #private;
    constructor(options?: DurationValueClientOptions);
    get(options?: GetOptions_7): Promise<string[]>;
    put(body: Array<string>, options?: PutOptions_7): Promise<void>;
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
    get(options?: GetOptions_5): Promise<number[]>;
    put(body: Array<number>, options?: PutOptions_5): Promise<void>;
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

declare interface GetOptions_12 extends OperationOptions {
}

declare interface GetOptions_13 extends OperationOptions {
}

declare interface GetOptions_14 extends OperationOptions {
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
    "children"?: Array<InnerModel>;
}

export declare type Int32 = number;

export declare class Int32ValueClient {
    #private;
    constructor(options?: Int32ValueClientOptions);
    get(options?: GetOptions): Promise<number[]>;
    put(body: Array<number>, options?: PutOptions): Promise<void>;
}

declare interface Int32ValueClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare type Int64 = bigint;

export declare class Int64ValueClient {
    #private;
    constructor(options?: Int64ValueClientOptions);
    get(options?: GetOptions_2): Promise<bigint[]>;
    put(body: Array<bigint>, options?: PutOptions_2): Promise<void>;
}

declare interface Int64ValueClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare type Integer = number;

export declare function jsonArrayBooleanToApplicationTransform(items_?: any): Array<boolean>;

export declare function jsonArrayBooleanToTransportTransform(items_?: Array<boolean> | null): any;

export declare function jsonArrayDurationToApplicationTransform(items_?: any): Array<string>;

export declare function jsonArrayDurationToTransportTransform(items_?: Array<string> | null): any;

export declare function jsonArrayElementToApplicationTransform(items_?: any): Array<number | null>;

export declare function jsonArrayElementToApplicationTransform_2(items_?: any): Array<number | null>;

export declare function jsonArrayElementToApplicationTransform_3(items_?: any): Array<boolean | null>;

export declare function jsonArrayElementToApplicationTransform_4(items_?: any): Array<string | null>;

export declare function jsonArrayElementToApplicationTransform_5(items_?: any): Array<InnerModel | null>;

export declare function jsonArrayElementToTransportTransform(items_?: Array<number | null> | null): any;

export declare function jsonArrayElementToTransportTransform_2(items_?: Array<number | null> | null): any;

export declare function jsonArrayElementToTransportTransform_3(items_?: Array<boolean | null> | null): any;

export declare function jsonArrayElementToTransportTransform_4(items_?: Array<string | null> | null): any;

export declare function jsonArrayElementToTransportTransform_5(items_?: Array<InnerModel | null> | null): any;

export declare function jsonArrayFloat32ToApplicationTransform(items_?: any): Array<number>;

export declare function jsonArrayFloat32ToTransportTransform(items_?: Array<number> | null): any;

export declare function jsonArrayInnerModelToApplicationTransform(items_?: any): Array<InnerModel>;

export declare function jsonArrayInnerModelToTransportTransform(items_?: Array<InnerModel> | null): any;

export declare function jsonArrayInt32ToApplicationTransform(items_?: any): Array<number>;

export declare function jsonArrayInt32ToTransportTransform(items_?: Array<number> | null): any;

export declare function jsonArrayInt64ToApplicationTransform(items_?: any): Array<bigint>;

export declare function jsonArrayInt64ToTransportTransform(items_?: Array<bigint> | null): any;

export declare function jsonArrayStringToApplicationTransform(items_?: any): Array<string>;

export declare function jsonArrayStringToTransportTransform(items_?: Array<string> | null): any;

export declare function jsonArrayUnknownToApplicationTransform(items_?: any): Array<unknown>;

export declare function jsonArrayUnknownToTransportTransform(items_?: Array<unknown> | null): any;

export declare function jsonArrayUtcDateTimeToApplicationTransform(items_?: any): Array<Date>;

export declare function jsonArrayUtcDateTimeToTransportTransform(items_?: Array<Date> | null): any;

export declare function jsonInnerModelToApplicationTransform(input_?: any): InnerModel;

export declare function jsonInnerModelToTransportTransform(input_?: InnerModel | null): any;

export declare class ModelValueClient {
    #private;
    constructor(options?: ModelValueClientOptions);
    get(options?: GetOptions_9): Promise<InnerModel[]>;
    put(body: Array<InnerModel>, options?: PutOptions_9): Promise<void>;
}

declare interface ModelValueClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare class NullableBooleanValueClient {
    #private;
    constructor(options?: NullableBooleanValueClientOptions);
    get(options?: GetOptions_12): Promise<boolean[]>;
    put(body: Array<boolean | null>, options?: PutOptions_12): Promise<void>;
}

declare interface NullableBooleanValueClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare class NullableFloatValueClient {
    #private;
    constructor(options?: NullableFloatValueClientOptions);
    get(options?: GetOptions_10): Promise<number[]>;
    put(body: Array<number | null>, options?: PutOptions_10): Promise<void>;
}

declare interface NullableFloatValueClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare class NullableInt32ValueClient {
    #private;
    constructor(options?: NullableInt32ValueClientOptions);
    get(options?: GetOptions_11): Promise<number[]>;
    put(body: Array<number | null>, options?: PutOptions_11): Promise<void>;
}

declare interface NullableInt32ValueClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare class NullableModelValueClient {
    #private;
    constructor(options?: NullableModelValueClientOptions);
    get(options?: GetOptions_14): Promise<InnerModel[]>;
    put(body: Array<InnerModel | null>, options?: PutOptions_14): Promise<void>;
}

declare interface NullableModelValueClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare class NullableStringValueClient {
    #private;
    constructor(options?: NullableStringValueClientOptions);
    get(options?: GetOptions_13): Promise<string[]>;
    put(body: Array<string | null>, options?: PutOptions_13): Promise<void>;
}

declare interface NullableStringValueClientOptions extends ClientOptions {
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

declare interface PutOptions_12 extends OperationOptions {
}

declare interface PutOptions_13 extends OperationOptions {
}

declare interface PutOptions_14 extends OperationOptions {
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

export declare function putPayloadToTransport(payload: Array<InnerModel | null>): any;

export declare function putPayloadToTransport_10(payload: Array<number>): any;

export declare function putPayloadToTransport_11(payload: Array<string>): any;

export declare function putPayloadToTransport_12(payload: Array<boolean>): any;

export declare function putPayloadToTransport_13(payload: Array<bigint>): any;

export declare function putPayloadToTransport_14(payload: Array<number>): any;

export declare function putPayloadToTransport_2(payload: Array<string | null>): any;

export declare function putPayloadToTransport_3(payload: Array<boolean | null>): any;

export declare function putPayloadToTransport_4(payload: Array<number | null>): any;

export declare function putPayloadToTransport_5(payload: Array<number | null>): any;

export declare function putPayloadToTransport_6(payload: Array<InnerModel>): any;

export declare function putPayloadToTransport_7(payload: Array<unknown>): any;

export declare function putPayloadToTransport_8(payload: Array<string>): any;

export declare function putPayloadToTransport_9(payload: Array<Date>): any;

declare type String_2 = string;
export { String_2 as String }

export declare class StringValueClient {
    #private;
    constructor(options?: StringValueClientOptions);
    get(options?: GetOptions_4): Promise<string[]>;
    put(body: Array<string>, options?: PutOptions_4): Promise<void>;
}

declare interface StringValueClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare class UnknownValueClient {
    #private;
    constructor(options?: UnknownValueClientOptions);
    get(options?: GetOptions_8): Promise<unknown[]>;
    put(body: Array<unknown>, options?: PutOptions_8): Promise<void>;
}

declare interface UnknownValueClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare type UtcDateTime = Date;

export { }
