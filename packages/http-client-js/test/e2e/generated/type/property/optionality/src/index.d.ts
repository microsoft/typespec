import { ClientOptions } from '@typespec/ts-http-runtime';
import { PathUncheckedResponse } from '@typespec/ts-http-runtime';

export declare class BooleanLiteralClient {
    #private;
    constructor(options?: BooleanLiteralClientOptions);
    getAll(options?: GetAllOptions_12): Promise<BooleanLiteralProperty>;
    getDefault(options?: GetDefaultOptions_12): Promise<BooleanLiteralProperty>;
    putAll(body: BooleanLiteralProperty, options?: PutAllOptions_12): Promise<void>;
    putDefault(body: BooleanLiteralProperty, options?: PutDefaultOptions_12): Promise<void>;
}

declare interface BooleanLiteralClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare interface BooleanLiteralProperty {
    "property"?: true;
}

export declare type Bytes = Uint8Array;

export declare class BytesClient {
    #private;
    constructor(options?: BytesClientOptions);
    getAll(options?: GetAllOptions_2): Promise<BytesProperty>;
    getDefault(options?: GetDefaultOptions_2): Promise<BytesProperty>;
    putAll(body: BytesProperty, options?: PutAllOptions_2): Promise<void>;
    putDefault(body: BytesProperty, options?: PutDefaultOptions_2): Promise<void>;
}

declare interface BytesClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare interface BytesProperty {
    "property"?: Uint8Array;
}

export declare class CollectionsByteClient {
    #private;
    constructor(options?: CollectionsByteClientOptions);
    getAll(options?: GetAllOptions_7): Promise<CollectionsByteProperty>;
    getDefault(options?: GetDefaultOptions_7): Promise<CollectionsByteProperty>;
    putAll(body: CollectionsByteProperty, options?: PutAllOptions_7): Promise<void>;
    putDefault(body: CollectionsByteProperty, options?: PutDefaultOptions_7): Promise<void>;
}

declare interface CollectionsByteClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare interface CollectionsByteProperty {
    "property"?: Array<Uint8Array>;
}

export declare class CollectionsModelClient {
    #private;
    constructor(options?: CollectionsModelClientOptions);
    getAll(options?: GetAllOptions_8): Promise<CollectionsModelProperty>;
    getDefault(options?: GetDefaultOptions_8): Promise<CollectionsModelProperty>;
    putAll(body: CollectionsModelProperty, options?: PutAllOptions_8): Promise<void>;
    putDefault(body: CollectionsModelProperty, options?: PutDefaultOptions_8): Promise<void>;
}

declare interface CollectionsModelClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare interface CollectionsModelProperty {
    "property"?: Array<StringProperty>;
}

export declare function dateDeserializer(date?: string | null): Date;

export declare function dateRfc3339Serializer(date?: Date | null): string;

export declare function dateRfc7231Deserializer(date?: string | null): Date;

export declare function dateRfc7231Serializer(date?: Date | null): string;

export declare class DatetimeClient {
    #private;
    constructor(options?: DatetimeClientOptions);
    getAll(options?: GetAllOptions_3): Promise<DatetimeProperty>;
    getDefault(options?: GetDefaultOptions_3): Promise<DatetimeProperty>;
    putAll(body: DatetimeProperty, options?: PutAllOptions_3): Promise<void>;
    putDefault(body: DatetimeProperty, options?: PutDefaultOptions_3): Promise<void>;
}

declare interface DatetimeClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare interface DatetimeProperty {
    "property"?: Date;
}

export declare function dateUnixTimestampDeserializer(date?: number | null): Date;

export declare function dateUnixTimestampSerializer(date?: Date | null): number;

export declare function decodeBase64(value: string): Uint8Array | undefined;

export declare type Duration = string;

export declare class DurationClient {
    #private;
    constructor(options?: DurationClientOptions);
    getAll(options?: GetAllOptions_4): Promise<DurationProperty>;
    getDefault(options?: GetDefaultOptions_4): Promise<DurationProperty>;
    putAll(body: DurationProperty, options?: PutAllOptions_4): Promise<void>;
    putDefault(body: DurationProperty, options?: PutDefaultOptions_4): Promise<void>;
}

declare interface DurationClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare interface DurationProperty {
    "property"?: string;
}

export declare function encodeUint8Array(value: Uint8Array | undefined | null, encoding: BufferEncoding): string | undefined;

export declare class FloatLiteralClient {
    #private;
    constructor(options?: FloatLiteralClientOptions);
    getAll(options?: GetAllOptions_11): Promise<FloatLiteralProperty>;
    getDefault(options?: GetDefaultOptions_11): Promise<FloatLiteralProperty>;
    putAll(body: FloatLiteralProperty, options?: PutAllOptions_11): Promise<void>;
    putDefault(body: FloatLiteralProperty, options?: PutDefaultOptions_11): Promise<void>;
}

declare interface FloatLiteralClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare interface FloatLiteralProperty {
    "property"?: 1.25;
}

declare interface GetAllOptions extends OperationOptions {
}

declare interface GetAllOptions_10 extends OperationOptions {
}

declare interface GetAllOptions_11 extends OperationOptions {
}

declare interface GetAllOptions_12 extends OperationOptions {
}

declare interface GetAllOptions_13 extends OperationOptions {
}

declare interface GetAllOptions_14 extends OperationOptions {
}

declare interface GetAllOptions_15 extends OperationOptions {
}

declare interface GetAllOptions_16 extends OperationOptions {
}

declare interface GetAllOptions_2 extends OperationOptions {
}

declare interface GetAllOptions_3 extends OperationOptions {
}

declare interface GetAllOptions_4 extends OperationOptions {
}

declare interface GetAllOptions_5 extends OperationOptions {
}

declare interface GetAllOptions_6 extends OperationOptions {
}

declare interface GetAllOptions_7 extends OperationOptions {
}

declare interface GetAllOptions_8 extends OperationOptions {
}

declare interface GetAllOptions_9 extends OperationOptions {
}

declare interface GetDefaultOptions extends OperationOptions {
}

declare interface GetDefaultOptions_10 extends OperationOptions {
}

declare interface GetDefaultOptions_11 extends OperationOptions {
}

declare interface GetDefaultOptions_12 extends OperationOptions {
}

declare interface GetDefaultOptions_13 extends OperationOptions {
}

declare interface GetDefaultOptions_14 extends OperationOptions {
}

declare interface GetDefaultOptions_15 extends OperationOptions {
}

declare interface GetDefaultOptions_2 extends OperationOptions {
}

declare interface GetDefaultOptions_3 extends OperationOptions {
}

declare interface GetDefaultOptions_4 extends OperationOptions {
}

declare interface GetDefaultOptions_5 extends OperationOptions {
}

declare interface GetDefaultOptions_6 extends OperationOptions {
}

declare interface GetDefaultOptions_7 extends OperationOptions {
}

declare interface GetDefaultOptions_8 extends OperationOptions {
}

declare interface GetDefaultOptions_9 extends OperationOptions {
}

declare interface GetRequiredOnlyOptions extends OperationOptions {
}

export declare type Int32 = number;

export declare type Int64 = bigint;

export declare type Integer = number;

export declare class IntLiteralClient {
    #private;
    constructor(options?: IntLiteralClientOptions);
    getAll(options?: GetAllOptions_10): Promise<IntLiteralProperty>;
    getDefault(options?: GetDefaultOptions_10): Promise<IntLiteralProperty>;
    putAll(body: IntLiteralProperty, options?: PutAllOptions_10): Promise<void>;
    putDefault(body: IntLiteralProperty, options?: PutDefaultOptions_10): Promise<void>;
}

declare interface IntLiteralClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare interface IntLiteralProperty {
    "property"?: 1;
}

export declare function jsonArrayBytesToApplicationTransform(items_?: any): Array<Uint8Array>;

export declare function jsonArrayBytesToTransportTransform(items_?: Array<Uint8Array> | null): any;

export declare function jsonArrayStringPropertyToApplicationTransform(items_?: any): Array<StringProperty>;

export declare function jsonArrayStringPropertyToTransportTransform(items_?: Array<StringProperty> | null): any;

export declare function jsonBooleanLiteralPropertyToApplicationTransform(input_?: any): BooleanLiteralProperty;

export declare function jsonBooleanLiteralPropertyToTransportTransform(input_?: BooleanLiteralProperty | null): any;

export declare function jsonBytesPropertyToApplicationTransform(input_?: any): BytesProperty;

export declare function jsonBytesPropertyToTransportTransform(input_?: BytesProperty | null): any;

export declare function jsonCollectionsBytePropertyToApplicationTransform(input_?: any): CollectionsByteProperty;

export declare function jsonCollectionsBytePropertyToTransportTransform(input_?: CollectionsByteProperty | null): any;

export declare function jsonCollectionsModelPropertyToApplicationTransform(input_?: any): CollectionsModelProperty;

export declare function jsonCollectionsModelPropertyToTransportTransform(input_?: CollectionsModelProperty | null): any;

export declare function jsonDatetimePropertyToApplicationTransform(input_?: any): DatetimeProperty;

export declare function jsonDatetimePropertyToTransportTransform(input_?: DatetimeProperty | null): any;

export declare function jsonDurationPropertyToApplicationTransform(input_?: any): DurationProperty;

export declare function jsonDurationPropertyToTransportTransform(input_?: DurationProperty | null): any;

export declare function jsonFloatLiteralPropertyToApplicationTransform(input_?: any): FloatLiteralProperty;

export declare function jsonFloatLiteralPropertyToTransportTransform(input_?: FloatLiteralProperty | null): any;

export declare function jsonIntLiteralPropertyToApplicationTransform(input_?: any): IntLiteralProperty;

export declare function jsonIntLiteralPropertyToTransportTransform(input_?: IntLiteralProperty | null): any;

export declare function jsonPlainDatePropertyToApplicationTransform(input_?: any): PlainDateProperty;

export declare function jsonPlainDatePropertyToTransportTransform(input_?: PlainDateProperty | null): any;

export declare function jsonPlainTimePropertyToApplicationTransform(input_?: any): PlainTimeProperty;

export declare function jsonPlainTimePropertyToTransportTransform(input_?: PlainTimeProperty | null): any;

export declare function jsonRequiredAndOptionalPropertyToApplicationTransform(input_?: any): RequiredAndOptionalProperty;

export declare function jsonRequiredAndOptionalPropertyToTransportTransform(input_?: RequiredAndOptionalProperty | null): any;

export declare function jsonStringLiteralPropertyToApplicationTransform(input_?: any): StringLiteralProperty;

export declare function jsonStringLiteralPropertyToTransportTransform(input_?: StringLiteralProperty | null): any;

export declare function jsonStringPropertyToApplicationTransform(input_?: any): StringProperty;

export declare function jsonStringPropertyToTransportTransform(input_?: StringProperty | null): any;

export declare function jsonUnionFloatLiteralPropertyToApplicationTransform(input_?: any): UnionFloatLiteralProperty;

export declare function jsonUnionFloatLiteralPropertyToTransportTransform(input_?: UnionFloatLiteralProperty | null): any;

export declare function jsonUnionIntLiteralPropertyToApplicationTransform(input_?: any): UnionIntLiteralProperty;

export declare function jsonUnionIntLiteralPropertyToTransportTransform(input_?: UnionIntLiteralProperty | null): any;

export declare function jsonUnionStringLiteralPropertyToApplicationTransform(input_?: any): UnionStringLiteralProperty;

export declare function jsonUnionStringLiteralPropertyToTransportTransform(input_?: UnionStringLiteralProperty | null): any;

export declare type Numeric = number;

declare interface OperationOptions {
    operationOptions?: {
        onResponse?: (rawResponse: PathUncheckedResponse) => void;
    };
}

export declare class OperationsTemplateClient {
    #private;
    constructor(options?: OperationsTemplateClientOptions);
}

declare interface OperationsTemplateClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare class OptionalClient {
    #private;
    operationsTemplateClient: OperationsTemplateClient;
    stringClient: StringClient;
    bytesClient: BytesClient;
    datetimeClient: DatetimeClient;
    durationClient: DurationClient;
    plainDateClient: PlainDateClient;
    plainTimeClient: PlainTimeClient;
    collectionsByteClient: CollectionsByteClient;
    collectionsModelClient: CollectionsModelClient;
    stringLiteralClient: StringLiteralClient;
    intLiteralClient: IntLiteralClient;
    floatLiteralClient: FloatLiteralClient;
    booleanLiteralClient: BooleanLiteralClient;
    unionStringLiteralClient: UnionStringLiteralClient;
    unionIntLiteralClient: UnionIntLiteralClient;
    unionFloatLiteralClient: UnionFloatLiteralClient;
    requiredAndOptionalClient: RequiredAndOptionalClient;
    constructor(options?: OptionalClientOptions);
}

declare interface OptionalClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare type PlainDate = string;

export declare class PlainDateClient {
    #private;
    constructor(options?: PlainDateClientOptions);
    getAll(options?: GetAllOptions_5): Promise<PlainDateProperty>;
    getDefault(options?: GetDefaultOptions_5): Promise<PlainDateProperty>;
    putAll(body: PlainDateProperty, options?: PutAllOptions_5): Promise<void>;
    putDefault(body: PlainDateProperty, options?: PutDefaultOptions_5): Promise<void>;
}

declare interface PlainDateClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare interface PlainDateProperty {
    "property"?: string;
}

export declare type PlainTime = string;

export declare class PlainTimeClient {
    #private;
    constructor(options?: PlainTimeClientOptions);
    getAll(options?: GetAllOptions_6): Promise<PlainTimeProperty>;
    getDefault(options?: GetDefaultOptions_6): Promise<PlainTimeProperty>;
    putAll(body: PlainTimeProperty, options?: PutAllOptions_6): Promise<void>;
    putDefault(body: PlainTimeProperty, options?: PutDefaultOptions_6): Promise<void>;
}

declare interface PlainTimeClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare interface PlainTimeProperty {
    "property"?: string;
}

declare interface PutAllOptions extends OperationOptions {
}

declare interface PutAllOptions_10 extends OperationOptions {
}

declare interface PutAllOptions_11 extends OperationOptions {
}

declare interface PutAllOptions_12 extends OperationOptions {
}

declare interface PutAllOptions_13 extends OperationOptions {
}

declare interface PutAllOptions_14 extends OperationOptions {
}

declare interface PutAllOptions_15 extends OperationOptions {
}

declare interface PutAllOptions_16 extends OperationOptions {
}

declare interface PutAllOptions_2 extends OperationOptions {
}

declare interface PutAllOptions_3 extends OperationOptions {
}

declare interface PutAllOptions_4 extends OperationOptions {
}

declare interface PutAllOptions_5 extends OperationOptions {
}

declare interface PutAllOptions_6 extends OperationOptions {
}

declare interface PutAllOptions_7 extends OperationOptions {
}

declare interface PutAllOptions_8 extends OperationOptions {
}

declare interface PutAllOptions_9 extends OperationOptions {
}

export declare function putAllPayloadToTransport(payload: RequiredAndOptionalProperty): any;

export declare function putAllPayloadToTransport_10(payload: CollectionsByteProperty): any;

export declare function putAllPayloadToTransport_11(payload: PlainTimeProperty): any;

export declare function putAllPayloadToTransport_12(payload: PlainDateProperty): any;

export declare function putAllPayloadToTransport_13(payload: DurationProperty): any;

export declare function putAllPayloadToTransport_14(payload: DatetimeProperty): any;

export declare function putAllPayloadToTransport_15(payload: BytesProperty): any;

export declare function putAllPayloadToTransport_16(payload: StringProperty): any;

export declare function putAllPayloadToTransport_2(payload: UnionFloatLiteralProperty): any;

export declare function putAllPayloadToTransport_3(payload: UnionIntLiteralProperty): any;

export declare function putAllPayloadToTransport_4(payload: UnionStringLiteralProperty): any;

export declare function putAllPayloadToTransport_5(payload: BooleanLiteralProperty): any;

export declare function putAllPayloadToTransport_6(payload: FloatLiteralProperty): any;

export declare function putAllPayloadToTransport_7(payload: IntLiteralProperty): any;

export declare function putAllPayloadToTransport_8(payload: StringLiteralProperty): any;

export declare function putAllPayloadToTransport_9(payload: CollectionsModelProperty): any;

declare interface PutDefaultOptions extends OperationOptions {
}

declare interface PutDefaultOptions_10 extends OperationOptions {
}

declare interface PutDefaultOptions_11 extends OperationOptions {
}

declare interface PutDefaultOptions_12 extends OperationOptions {
}

declare interface PutDefaultOptions_13 extends OperationOptions {
}

declare interface PutDefaultOptions_14 extends OperationOptions {
}

declare interface PutDefaultOptions_15 extends OperationOptions {
}

declare interface PutDefaultOptions_2 extends OperationOptions {
}

declare interface PutDefaultOptions_3 extends OperationOptions {
}

declare interface PutDefaultOptions_4 extends OperationOptions {
}

declare interface PutDefaultOptions_5 extends OperationOptions {
}

declare interface PutDefaultOptions_6 extends OperationOptions {
}

declare interface PutDefaultOptions_7 extends OperationOptions {
}

declare interface PutDefaultOptions_8 extends OperationOptions {
}

declare interface PutDefaultOptions_9 extends OperationOptions {
}

export declare function putDefaultPayloadToTransport(payload: UnionFloatLiteralProperty): any;

export declare function putDefaultPayloadToTransport_10(payload: PlainTimeProperty): any;

export declare function putDefaultPayloadToTransport_11(payload: PlainDateProperty): any;

export declare function putDefaultPayloadToTransport_12(payload: DurationProperty): any;

export declare function putDefaultPayloadToTransport_13(payload: DatetimeProperty): any;

export declare function putDefaultPayloadToTransport_14(payload: BytesProperty): any;

export declare function putDefaultPayloadToTransport_15(payload: StringProperty): any;

export declare function putDefaultPayloadToTransport_2(payload: UnionIntLiteralProperty): any;

export declare function putDefaultPayloadToTransport_3(payload: UnionStringLiteralProperty): any;

export declare function putDefaultPayloadToTransport_4(payload: BooleanLiteralProperty): any;

export declare function putDefaultPayloadToTransport_5(payload: FloatLiteralProperty): any;

export declare function putDefaultPayloadToTransport_6(payload: IntLiteralProperty): any;

export declare function putDefaultPayloadToTransport_7(payload: StringLiteralProperty): any;

export declare function putDefaultPayloadToTransport_8(payload: CollectionsModelProperty): any;

export declare function putDefaultPayloadToTransport_9(payload: CollectionsByteProperty): any;

declare interface PutRequiredOnlyOptions extends OperationOptions {
}

export declare function putRequiredOnlyPayloadToTransport(payload: RequiredAndOptionalProperty): any;

export declare class RequiredAndOptionalClient {
    #private;
    constructor(options?: RequiredAndOptionalClientOptions);
    getAll(options?: GetAllOptions_16): Promise<RequiredAndOptionalProperty>;
    getRequiredOnly(options?: GetRequiredOnlyOptions): Promise<RequiredAndOptionalProperty>;
    putAll(body: RequiredAndOptionalProperty, options?: PutAllOptions_16): Promise<void>;
    putRequiredOnly(body: RequiredAndOptionalProperty, options?: PutRequiredOnlyOptions): Promise<void>;
}

declare interface RequiredAndOptionalClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare interface RequiredAndOptionalProperty {
    "optionalProperty"?: string;
    "requiredProperty": number;
}

declare type String_2 = string;
export { String_2 as String }

export declare class StringClient {
    #private;
    constructor(options?: StringClientOptions);
    getAll(options?: GetAllOptions): Promise<StringProperty>;
    getDefault(options?: GetDefaultOptions): Promise<StringProperty>;
    putAll(body: StringProperty, options?: PutAllOptions): Promise<void>;
    putDefault(body: StringProperty, options?: PutDefaultOptions): Promise<void>;
}

declare interface StringClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare class StringLiteralClient {
    #private;
    constructor(options?: StringLiteralClientOptions);
    getAll(options?: GetAllOptions_9): Promise<StringLiteralProperty>;
    getDefault(options?: GetDefaultOptions_9): Promise<StringLiteralProperty>;
    putAll(body: StringLiteralProperty, options?: PutAllOptions_9): Promise<void>;
    putDefault(body: StringLiteralProperty, options?: PutDefaultOptions_9): Promise<void>;
}

declare interface StringLiteralClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare interface StringLiteralProperty {
    "property"?: "hello";
}

export declare interface StringProperty {
    "property"?: string;
}

export declare class UnionFloatLiteralClient {
    #private;
    constructor(options?: UnionFloatLiteralClientOptions);
    getAll(options?: GetAllOptions_15): Promise<UnionFloatLiteralProperty>;
    getDefault(options?: GetDefaultOptions_15): Promise<UnionFloatLiteralProperty>;
    putAll(body: UnionFloatLiteralProperty, options?: PutAllOptions_15): Promise<void>;
    putDefault(body: UnionFloatLiteralProperty, options?: PutDefaultOptions_15): Promise<void>;
}

declare interface UnionFloatLiteralClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare interface UnionFloatLiteralProperty {
    "property"?: 1.25 | 2.375;
}

export declare class UnionIntLiteralClient {
    #private;
    constructor(options?: UnionIntLiteralClientOptions);
    getAll(options?: GetAllOptions_14): Promise<UnionIntLiteralProperty>;
    getDefault(options?: GetDefaultOptions_14): Promise<UnionIntLiteralProperty>;
    putAll(body: UnionIntLiteralProperty, options?: PutAllOptions_14): Promise<void>;
    putDefault(body: UnionIntLiteralProperty, options?: PutDefaultOptions_14): Promise<void>;
}

declare interface UnionIntLiteralClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare interface UnionIntLiteralProperty {
    "property"?: 1 | 2;
}

export declare class UnionStringLiteralClient {
    #private;
    constructor(options?: UnionStringLiteralClientOptions);
    getAll(options?: GetAllOptions_13): Promise<UnionStringLiteralProperty>;
    getDefault(options?: GetDefaultOptions_13): Promise<UnionStringLiteralProperty>;
    putAll(body: UnionStringLiteralProperty, options?: PutAllOptions_13): Promise<void>;
    putDefault(body: UnionStringLiteralProperty, options?: PutDefaultOptions_13): Promise<void>;
}

declare interface UnionStringLiteralClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare interface UnionStringLiteralProperty {
    "property"?: "hello" | "world";
}

export declare type UtcDateTime = Date;

export { }
