import { ClientOptions } from '@typespec/ts-http-runtime';
import { PathUncheckedResponse } from '@typespec/ts-http-runtime';

declare type Boolean_2 = boolean;
export { Boolean_2 as Boolean }

export declare class BooleanClient {
    #private;
    constructor(options?: BooleanClientOptions);
    get(options?: GetOptions): Promise<BooleanProperty>;
    put(body: BooleanProperty, options?: PutOptions): Promise<void>;
}

declare interface BooleanClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare class BooleanLiteralClient {
    #private;
    constructor(options?: BooleanLiteralClientOptions);
    get(options?: GetOptions_25): Promise<BooleanLiteralProperty>;
    put(body: BooleanLiteralProperty, options?: PutOptions_25): Promise<void>;
}

declare interface BooleanLiteralClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare interface BooleanLiteralProperty {
    "property": true;
}

export declare interface BooleanProperty {
    "property": boolean;
}

export declare type Bytes = Uint8Array;

export declare class BytesClient {
    #private;
    constructor(options?: BytesClientOptions);
    get(options?: GetOptions_3): Promise<BytesProperty>;
    put(body: BytesProperty, options?: PutOptions_3): Promise<void>;
}

declare interface BytesClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare interface BytesProperty {
    "property": Uint8Array;
}

export declare class CollectionsIntClient {
    #private;
    constructor(options?: CollectionsIntClientOptions);
    get(options?: GetOptions_14): Promise<CollectionsIntProperty>;
    put(body: CollectionsIntProperty, options?: PutOptions_14): Promise<void>;
}

declare interface CollectionsIntClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare interface CollectionsIntProperty {
    "property": Array<number>;
}

export declare class CollectionsModelClient {
    #private;
    constructor(options?: CollectionsModelClientOptions);
    get(options?: GetOptions_15): Promise<CollectionsModelProperty>;
    put(body: CollectionsModelProperty, options?: PutOptions_15): Promise<void>;
}

declare interface CollectionsModelClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare interface CollectionsModelProperty {
    "property": Array<InnerModel>;
}

export declare class CollectionsStringClient {
    #private;
    constructor(options?: CollectionsStringClientOptions);
    get(options?: GetOptions_13): Promise<CollectionsStringProperty>;
    put(body: CollectionsStringProperty, options?: PutOptions_13): Promise<void>;
}

declare interface CollectionsStringClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare interface CollectionsStringProperty {
    "property": Array<string>;
}

export declare function dateDeserializer(date?: string | null): Date;

export declare function dateRfc3339Serializer(date?: Date | null): string;

export declare function dateRfc7231Deserializer(date?: string | null): Date;

export declare function dateRfc7231Serializer(date?: Date | null): string;

export declare class DatetimeClient {
    #private;
    constructor(options?: DatetimeClientOptions);
    get(options?: GetOptions_8): Promise<DatetimeProperty>;
    put(body: DatetimeProperty, options?: PutOptions_8): Promise<void>;
}

declare interface DatetimeClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare interface DatetimeProperty {
    "property": Date;
}

export declare function dateUnixTimestampDeserializer(date?: number | null): Date;

export declare function dateUnixTimestampSerializer(date?: Date | null): number;

export declare type Decimal = number;

export declare type Decimal128 = number;

export declare class Decimal128Client {
    #private;
    constructor(options?: Decimal128ClientOptions);
    get(options?: GetOptions_7): Promise<Decimal128Property>;
    put(body: Decimal128Property, options?: PutOptions_7): Promise<void>;
}

declare interface Decimal128ClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare interface Decimal128Property {
    "property": number;
}

export declare class DecimalClient {
    #private;
    constructor(options?: DecimalClientOptions);
    get(options?: GetOptions_6): Promise<DecimalProperty>;
    put(body: DecimalProperty, options?: PutOptions_6): Promise<void>;
}

declare interface DecimalClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare interface DecimalProperty {
    "property": number;
}

export declare function decodeBase64(value: string): Uint8Array | undefined;

export declare class DictionaryStringClient {
    #private;
    constructor(options?: DictionaryStringClientOptions);
    get(options?: GetOptions_16): Promise<DictionaryStringProperty>;
    put(body: DictionaryStringProperty, options?: PutOptions_16): Promise<void>;
}

declare interface DictionaryStringClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare interface DictionaryStringProperty {
    "property": Record<string, string>;
}

export declare type Duration = string;

export declare class DurationClient {
    #private;
    constructor(options?: DurationClientOptions);
    get(options?: GetOptions_9): Promise<DurationProperty>;
    put(body: DurationProperty, options?: PutOptions_9): Promise<void>;
}

declare interface DurationClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare interface DurationProperty {
    "property": string;
}

export declare function encodeUint8Array(value: Uint8Array | undefined | null, encoding: BufferEncoding): string | undefined;

export declare class EnumClient {
    #private;
    constructor(options?: EnumClientOptions);
    get(options?: GetOptions_10): Promise<EnumProperty>;
    put(body: EnumProperty, options?: PutOptions_10): Promise<void>;
}

declare interface EnumClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare interface EnumProperty {
    "property": FixedInnerEnum;
}

export declare class ExtensibleEnumClient {
    #private;
    constructor(options?: ExtensibleEnumClientOptions);
    get(options?: GetOptions_11): Promise<ExtensibleEnumProperty>;
    put(body: ExtensibleEnumProperty, options?: PutOptions_11): Promise<void>;
}

declare interface ExtensibleEnumClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare interface ExtensibleEnumProperty {
    "property": InnerEnum;
}

export declare enum FixedInnerEnum {
    ValueOne = "ValueOne",
    ValueTwo = "ValueTwo"
}

export declare type Float = number;

export declare type Float32 = number;

export declare type Float64 = number;

export declare class FloatClient {
    #private;
    constructor(options?: FloatClientOptions);
    get(options?: GetOptions_5): Promise<FloatProperty>;
    put(body: FloatProperty, options?: PutOptions_5): Promise<void>;
}

declare interface FloatClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare class FloatLiteralClient {
    #private;
    constructor(options?: FloatLiteralClientOptions);
    get(options?: GetOptions_24): Promise<FloatLiteralProperty>;
    put(body: FloatLiteralProperty, options?: PutOptions_24): Promise<void>;
}

declare interface FloatLiteralClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare interface FloatLiteralProperty {
    "property": 43.125;
}

export declare interface FloatProperty {
    "property": number;
}

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

declare interface GetOptions_15 extends OperationOptions {
}

declare interface GetOptions_16 extends OperationOptions {
}

declare interface GetOptions_17 extends OperationOptions {
}

declare interface GetOptions_18 extends OperationOptions {
}

declare interface GetOptions_19 extends OperationOptions {
}

declare interface GetOptions_2 extends OperationOptions {
}

declare interface GetOptions_20 extends OperationOptions {
}

declare interface GetOptions_21 extends OperationOptions {
}

declare interface GetOptions_22 extends OperationOptions {
}

declare interface GetOptions_23 extends OperationOptions {
}

declare interface GetOptions_24 extends OperationOptions {
}

declare interface GetOptions_25 extends OperationOptions {
}

declare interface GetOptions_26 extends OperationOptions {
}

declare interface GetOptions_27 extends OperationOptions {
}

declare interface GetOptions_28 extends OperationOptions {
}

declare interface GetOptions_29 extends OperationOptions {
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

export declare type InnerEnum = string | "ValueOne" | "ValueTwo";

export declare interface InnerModel {
    "property": string;
}

export declare type Int32 = number;

export declare type Int64 = bigint;

export declare class IntClient {
    #private;
    constructor(options?: IntClientOptions);
    get(options?: GetOptions_4): Promise<IntProperty>;
    put(body: IntProperty, options?: PutOptions_4): Promise<void>;
}

declare interface IntClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare type Integer = number;

export declare class IntLiteralClient {
    #private;
    constructor(options?: IntLiteralClientOptions);
    get(options?: GetOptions_23): Promise<IntLiteralProperty>;
    put(body: IntLiteralProperty, options?: PutOptions_23): Promise<void>;
}

declare interface IntLiteralClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare interface IntLiteralProperty {
    "property": 42;
}

export declare interface IntProperty {
    "property": number;
}

export declare function jsonArrayInnerModelToApplicationTransform(items_?: any): Array<InnerModel>;

export declare function jsonArrayInnerModelToTransportTransform(items_?: Array<InnerModel> | null): any;

export declare function jsonArrayInt32ToApplicationTransform(items_?: any): Array<number>;

export declare function jsonArrayInt32ToTransportTransform(items_?: Array<number> | null): any;

export declare function jsonArrayStringToApplicationTransform(items_?: any): Array<string>;

export declare function jsonArrayStringToTransportTransform(items_?: Array<string> | null): any;

export declare function jsonBooleanLiteralPropertyToApplicationTransform(input_?: any): BooleanLiteralProperty;

export declare function jsonBooleanLiteralPropertyToTransportTransform(input_?: BooleanLiteralProperty | null): any;

export declare function jsonBooleanPropertyToApplicationTransform(input_?: any): BooleanProperty;

export declare function jsonBooleanPropertyToTransportTransform(input_?: BooleanProperty | null): any;

export declare function jsonBytesPropertyToApplicationTransform(input_?: any): BytesProperty;

export declare function jsonBytesPropertyToTransportTransform(input_?: BytesProperty | null): any;

export declare function jsonCollectionsIntPropertyToApplicationTransform(input_?: any): CollectionsIntProperty;

export declare function jsonCollectionsIntPropertyToTransportTransform(input_?: CollectionsIntProperty | null): any;

export declare function jsonCollectionsModelPropertyToApplicationTransform(input_?: any): CollectionsModelProperty;

export declare function jsonCollectionsModelPropertyToTransportTransform(input_?: CollectionsModelProperty | null): any;

export declare function jsonCollectionsStringPropertyToApplicationTransform(input_?: any): CollectionsStringProperty;

export declare function jsonCollectionsStringPropertyToTransportTransform(input_?: CollectionsStringProperty | null): any;

export declare function jsonDatetimePropertyToApplicationTransform(input_?: any): DatetimeProperty;

export declare function jsonDatetimePropertyToTransportTransform(input_?: DatetimeProperty | null): any;

export declare function jsonDecimal128PropertyToApplicationTransform(input_?: any): Decimal128Property;

export declare function jsonDecimal128PropertyToTransportTransform(input_?: Decimal128Property | null): any;

export declare function jsonDecimalPropertyToApplicationTransform(input_?: any): DecimalProperty;

export declare function jsonDecimalPropertyToTransportTransform(input_?: DecimalProperty | null): any;

export declare function jsonDictionaryStringPropertyToApplicationTransform(input_?: any): DictionaryStringProperty;

export declare function jsonDictionaryStringPropertyToTransportTransform(input_?: DictionaryStringProperty | null): any;

export declare function jsonDurationPropertyToApplicationTransform(input_?: any): DurationProperty;

export declare function jsonDurationPropertyToTransportTransform(input_?: DurationProperty | null): any;

export declare function jsonEnumPropertyToApplicationTransform(input_?: any): EnumProperty;

export declare function jsonEnumPropertyToTransportTransform(input_?: EnumProperty | null): any;

export declare function jsonExtensibleEnumPropertyToApplicationTransform(input_?: any): ExtensibleEnumProperty;

export declare function jsonExtensibleEnumPropertyToTransportTransform(input_?: ExtensibleEnumProperty | null): any;

export declare function jsonFloatLiteralPropertyToApplicationTransform(input_?: any): FloatLiteralProperty;

export declare function jsonFloatLiteralPropertyToTransportTransform(input_?: FloatLiteralProperty | null): any;

export declare function jsonFloatPropertyToApplicationTransform(input_?: any): FloatProperty;

export declare function jsonFloatPropertyToTransportTransform(input_?: FloatProperty | null): any;

export declare function jsonInnerEnumToApplicationTransform(input_?: any): InnerEnum;

export declare function jsonInnerEnumToTransportTransform(input_?: InnerEnum | null): any;

export declare function jsonInnerModelToApplicationTransform(input_?: any): InnerModel;

export declare function jsonInnerModelToTransportTransform(input_?: InnerModel | null): any;

export declare function jsonIntLiteralPropertyToApplicationTransform(input_?: any): IntLiteralProperty;

export declare function jsonIntLiteralPropertyToTransportTransform(input_?: IntLiteralProperty | null): any;

export declare function jsonIntPropertyToApplicationTransform(input_?: any): IntProperty;

export declare function jsonIntPropertyToTransportTransform(input_?: IntProperty | null): any;

export declare function jsonModelPropertyToApplicationTransform(input_?: any): ModelProperty;

export declare function jsonModelPropertyToTransportTransform(input_?: ModelProperty | null): any;

export declare function jsonNeverPropertyToApplicationTransform(input_?: any): NeverProperty;

export declare function jsonNeverPropertyToTransportTransform(input_?: NeverProperty | null): any;

export declare function jsonRecordStringToApplicationTransform(items_?: any): Record<string, any>;

export declare function jsonRecordStringToTransportTransform(items_?: Record<string, any> | null): any;

export declare function jsonStringLiteralPropertyToApplicationTransform(input_?: any): StringLiteralProperty;

export declare function jsonStringLiteralPropertyToTransportTransform(input_?: StringLiteralProperty | null): any;

export declare function jsonStringPropertyToApplicationTransform(input_?: any): StringProperty;

export declare function jsonStringPropertyToTransportTransform(input_?: StringProperty | null): any;

export declare function jsonUnionEnumValuePropertyToApplicationTransform(input_?: any): UnionEnumValueProperty;

export declare function jsonUnionEnumValuePropertyToTransportTransform(input_?: UnionEnumValueProperty | null): any;

export declare function jsonUnionFloatLiteralPropertyToApplicationTransform(input_?: any): UnionFloatLiteralProperty;

export declare function jsonUnionFloatLiteralPropertyToTransportTransform(input_?: UnionFloatLiteralProperty | null): any;

export declare function jsonUnionIntLiteralPropertyToApplicationTransform(input_?: any): UnionIntLiteralProperty;

export declare function jsonUnionIntLiteralPropertyToTransportTransform(input_?: UnionIntLiteralProperty | null): any;

export declare function jsonUnionStringLiteralPropertyToApplicationTransform(input_?: any): UnionStringLiteralProperty;

export declare function jsonUnionStringLiteralPropertyToTransportTransform(input_?: UnionStringLiteralProperty | null): any;

export declare function jsonUnknownArrayPropertyToApplicationTransform(input_?: any): UnknownArrayProperty;

export declare function jsonUnknownArrayPropertyToTransportTransform(input_?: UnknownArrayProperty | null): any;

export declare function jsonUnknownDictPropertyToApplicationTransform(input_?: any): UnknownDictProperty;

export declare function jsonUnknownDictPropertyToTransportTransform(input_?: UnknownDictProperty | null): any;

export declare function jsonUnknownIntPropertyToApplicationTransform(input_?: any): UnknownIntProperty;

export declare function jsonUnknownIntPropertyToTransportTransform(input_?: UnknownIntProperty | null): any;

export declare function jsonUnknownStringPropertyToApplicationTransform(input_?: any): UnknownStringProperty;

export declare function jsonUnknownStringPropertyToTransportTransform(input_?: UnknownStringProperty | null): any;

export declare class ModelClient {
    #private;
    constructor(options?: ModelClientOptions);
    get(options?: GetOptions_12): Promise<ModelProperty>;
    put(body: ModelProperty, options?: PutOptions_12): Promise<void>;
}

declare interface ModelClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare class ModelOperationsClient {
    #private;
    constructor(options?: ModelOperationsClientOptions);
}

declare interface ModelOperationsClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare interface ModelProperty {
    "property": InnerModel;
}

export declare class NeverClient {
    #private;
    constructor(options?: NeverClientOptions);
    get(options?: GetOptions_17): Promise<NeverProperty>;
    put(body: NeverProperty, options?: PutOptions_17): Promise<void>;
}

declare interface NeverClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare interface NeverProperty {
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

declare interface PutOptions_15 extends OperationOptions {
}

declare interface PutOptions_16 extends OperationOptions {
}

declare interface PutOptions_17 extends OperationOptions {
}

declare interface PutOptions_18 extends OperationOptions {
}

declare interface PutOptions_19 extends OperationOptions {
}

declare interface PutOptions_2 extends OperationOptions {
}

declare interface PutOptions_20 extends OperationOptions {
}

declare interface PutOptions_21 extends OperationOptions {
}

declare interface PutOptions_22 extends OperationOptions {
}

declare interface PutOptions_23 extends OperationOptions {
}

declare interface PutOptions_24 extends OperationOptions {
}

declare interface PutOptions_25 extends OperationOptions {
}

declare interface PutOptions_26 extends OperationOptions {
}

declare interface PutOptions_27 extends OperationOptions {
}

declare interface PutOptions_28 extends OperationOptions {
}

declare interface PutOptions_29 extends OperationOptions {
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

export declare function putPayloadToTransport(payload: UnionEnumValueProperty): any;

export declare function putPayloadToTransport_10(payload: UnknownDictProperty): any;

export declare function putPayloadToTransport_11(payload: UnknownIntProperty): any;

export declare function putPayloadToTransport_12(payload: UnknownStringProperty): any;

export declare function putPayloadToTransport_13(payload: NeverProperty): any;

export declare function putPayloadToTransport_14(payload: DictionaryStringProperty): any;

export declare function putPayloadToTransport_15(payload: CollectionsModelProperty): any;

export declare function putPayloadToTransport_16(payload: CollectionsIntProperty): any;

export declare function putPayloadToTransport_17(payload: CollectionsStringProperty): any;

export declare function putPayloadToTransport_18(payload: ModelProperty): any;

export declare function putPayloadToTransport_19(payload: ExtensibleEnumProperty): any;

export declare function putPayloadToTransport_2(payload: UnionFloatLiteralProperty): any;

export declare function putPayloadToTransport_20(payload: EnumProperty): any;

export declare function putPayloadToTransport_21(payload: DurationProperty): any;

export declare function putPayloadToTransport_22(payload: DatetimeProperty): any;

export declare function putPayloadToTransport_23(payload: Decimal128Property): any;

export declare function putPayloadToTransport_24(payload: DecimalProperty): any;

export declare function putPayloadToTransport_25(payload: FloatProperty): any;

export declare function putPayloadToTransport_26(payload: IntProperty): any;

export declare function putPayloadToTransport_27(payload: BytesProperty): any;

export declare function putPayloadToTransport_28(payload: StringProperty): any;

export declare function putPayloadToTransport_29(payload: BooleanProperty): any;

export declare function putPayloadToTransport_3(payload: UnionIntLiteralProperty): any;

export declare function putPayloadToTransport_4(payload: UnionStringLiteralProperty): any;

export declare function putPayloadToTransport_5(payload: BooleanLiteralProperty): any;

export declare function putPayloadToTransport_6(payload: FloatLiteralProperty): any;

export declare function putPayloadToTransport_7(payload: IntLiteralProperty): any;

export declare function putPayloadToTransport_8(payload: StringLiteralProperty): any;

export declare function putPayloadToTransport_9(payload: UnknownArrayProperty): any;

declare type String_2 = string;
export { String_2 as String }

export declare class StringClient {
    #private;
    constructor(options?: StringClientOptions);
    get(options?: GetOptions_2): Promise<StringProperty>;
    put(body: StringProperty, options?: PutOptions_2): Promise<void>;
}

declare interface StringClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare class StringLiteralClient {
    #private;
    constructor(options?: StringLiteralClientOptions);
    get(options?: GetOptions_22): Promise<StringLiteralProperty>;
    put(body: StringLiteralProperty, options?: PutOptions_22): Promise<void>;
}

declare interface StringLiteralClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare interface StringLiteralProperty {
    "property": "hello";
}

export declare interface StringProperty {
    "property": string;
}

export declare class UnionEnumValueClient {
    #private;
    constructor(options?: UnionEnumValueClientOptions);
    get(options?: GetOptions_29): Promise<UnionEnumValueProperty>;
    put(body: UnionEnumValueProperty, options?: PutOptions_29): Promise<void>;
}

declare interface UnionEnumValueClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare interface UnionEnumValueProperty {
    "property": "value2";
}

export declare class UnionFloatLiteralClient {
    #private;
    constructor(options?: UnionFloatLiteralClientOptions);
    get(options?: GetOptions_28): Promise<UnionFloatLiteralProperty>;
    put(body: UnionFloatLiteralProperty, options?: PutOptions_28): Promise<void>;
}

declare interface UnionFloatLiteralClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare interface UnionFloatLiteralProperty {
    "property": 43.125 | 46.875;
}

export declare class UnionIntLiteralClient {
    #private;
    constructor(options?: UnionIntLiteralClientOptions);
    get(options?: GetOptions_27): Promise<UnionIntLiteralProperty>;
    put(body: UnionIntLiteralProperty, options?: PutOptions_27): Promise<void>;
}

declare interface UnionIntLiteralClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare interface UnionIntLiteralProperty {
    "property": 42 | 43;
}

export declare class UnionStringLiteralClient {
    #private;
    constructor(options?: UnionStringLiteralClientOptions);
    get(options?: GetOptions_26): Promise<UnionStringLiteralProperty>;
    put(body: UnionStringLiteralProperty, options?: PutOptions_26): Promise<void>;
}

declare interface UnionStringLiteralClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare interface UnionStringLiteralProperty {
    "property": "hello" | "world";
}

export declare class UnknownArrayClient {
    #private;
    constructor(options?: UnknownArrayClientOptions);
    get(options?: GetOptions_21): Promise<UnknownArrayProperty>;
    put(body: UnknownArrayProperty, options?: PutOptions_21): Promise<void>;
}

declare interface UnknownArrayClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare interface UnknownArrayProperty {
    "property": unknown;
}

export declare class UnknownDictClient {
    #private;
    constructor(options?: UnknownDictClientOptions);
    get(options?: GetOptions_20): Promise<UnknownDictProperty>;
    put(body: UnknownDictProperty, options?: PutOptions_20): Promise<void>;
}

declare interface UnknownDictClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare interface UnknownDictProperty {
    "property": unknown;
}

export declare class UnknownIntClient {
    #private;
    constructor(options?: UnknownIntClientOptions);
    get(options?: GetOptions_19): Promise<UnknownIntProperty>;
    put(body: UnknownIntProperty, options?: PutOptions_19): Promise<void>;
}

declare interface UnknownIntClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare interface UnknownIntProperty {
    "property": unknown;
}

export declare class UnknownStringClient {
    #private;
    constructor(options?: UnknownStringClientOptions);
    get(options?: GetOptions_18): Promise<UnknownStringProperty>;
    put(body: UnknownStringProperty, options?: PutOptions_18): Promise<void>;
}

declare interface UnknownStringClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare interface UnknownStringProperty {
    "property": unknown;
}

export declare type UtcDateTime = Date;

export declare class ValueTypesClient {
    #private;
    modelOperationsClient: ModelOperationsClient;
    booleanClient: BooleanClient;
    stringClient: StringClient;
    bytesClient: BytesClient;
    intClient: IntClient;
    floatClient: FloatClient;
    decimalClient: DecimalClient;
    decimal128Client: Decimal128Client;
    datetimeClient: DatetimeClient;
    durationClient: DurationClient;
    enumClient: EnumClient;
    extensibleEnumClient: ExtensibleEnumClient;
    modelClient: ModelClient;
    collectionsStringClient: CollectionsStringClient;
    collectionsIntClient: CollectionsIntClient;
    collectionsModelClient: CollectionsModelClient;
    dictionaryStringClient: DictionaryStringClient;
    neverClient: NeverClient;
    unknownStringClient: UnknownStringClient;
    unknownIntClient: UnknownIntClient;
    unknownDictClient: UnknownDictClient;
    unknownArrayClient: UnknownArrayClient;
    stringLiteralClient: StringLiteralClient;
    intLiteralClient: IntLiteralClient;
    floatLiteralClient: FloatLiteralClient;
    booleanLiteralClient: BooleanLiteralClient;
    unionStringLiteralClient: UnionStringLiteralClient;
    unionIntLiteralClient: UnionIntLiteralClient;
    unionFloatLiteralClient: UnionFloatLiteralClient;
    unionEnumValueClient: UnionEnumValueClient;
    constructor(options?: ValueTypesClientOptions);
}

declare interface ValueTypesClientOptions extends ClientOptions {
    endpoint?: string;
}

export { }
