import { ClientOptions } from '@typespec/ts-http-runtime';
import { PathUncheckedResponse } from '@typespec/ts-http-runtime';

export declare class AdditionalPropertiesClient {
    #private;
    modelOperationsClient: ModelOperationsClient;
    extendsUnknownClient: ExtendsUnknownClient;
    extendsUnknownDerivedClient: ExtendsUnknownDerivedClient;
    extendsUnknownDiscriminatedClient: ExtendsUnknownDiscriminatedClient;
    isUnknownClient: IsUnknownClient;
    isUnknownDerivedClient: IsUnknownDerivedClient;
    isUnknownDiscriminatedClient: IsUnknownDiscriminatedClient;
    extendsStringClient: ExtendsStringClient;
    isStringClient: IsStringClient;
    spreadStringClient: SpreadStringClient;
    extendsFloatClient: ExtendsFloatClient;
    isFloatClient: IsFloatClient;
    spreadFloatClient: SpreadFloatClient;
    extendsModelClient: ExtendsModelClient;
    isModelClient: IsModelClient;
    spreadModelClient: SpreadModelClient;
    extendsModelArrayClient: ExtendsModelArrayClient;
    isModelArrayClient: IsModelArrayClient;
    spreadModelArrayClient: SpreadModelArrayClient;
    spreadDifferentStringClient: SpreadDifferentStringClient;
    spreadDifferentFloatClient: SpreadDifferentFloatClient;
    spreadDifferentModelClient: SpreadDifferentModelClient;
    spreadDifferentModelArrayClient: SpreadDifferentModelArrayClient;
    extendsDifferentSpreadStringClient: ExtendsDifferentSpreadStringClient;
    extendsDifferentSpreadFloatClient: ExtendsDifferentSpreadFloatClient;
    extendsDifferentSpreadModelClient: ExtendsDifferentSpreadModelClient;
    extendsDifferentSpreadModelArrayClient: ExtendsDifferentSpreadModelArrayClient;
    multipleSpreadClient: MultipleSpreadClient;
    spreadRecordUnionClient: SpreadRecordUnionClient;
    spreadRecordNonDiscriminatedUnionClient: SpreadRecordNonDiscriminatedUnionClient;
    spreadRecordNonDiscriminatedUnion2Client: SpreadRecordNonDiscriminatedUnion2Client;
    spreadRecordNonDiscriminatedUnion3Client: SpreadRecordNonDiscriminatedUnion3Client;
    constructor(options?: AdditionalPropertiesClientOptions);
}

declare interface AdditionalPropertiesClientOptions extends ClientOptions {
    endpoint?: string;
}

declare type Boolean_2 = boolean;
export { Boolean_2 as Boolean }

export declare function dateDeserializer(date?: string | null): Date;

export declare function dateRfc3339Serializer(date?: Date | null): string;

export declare function dateRfc7231Deserializer(date?: string | null): Date;

export declare function dateRfc7231Serializer(date?: Date | null): string;

export declare function dateUnixTimestampDeserializer(date?: number | null): Date;

export declare function dateUnixTimestampSerializer(date?: Date | null): number;

export declare function decodeBase64(value: string): Uint8Array | undefined;

export declare interface DifferentSpreadFloatDerived extends DifferentSpreadFloatRecord {
    "derivedProp": number;
    "additionalProperties"?: Record<string, number>;
}

export declare interface DifferentSpreadFloatRecord {
    "name": string;
    "additionalProperties"?: Record<string, number>;
}

export declare interface DifferentSpreadModelArrayDerived extends DifferentSpreadModelArrayRecord {
    "derivedProp": Array<ModelForRecord>;
    "additionalProperties"?: Record<string, Array<ModelForRecord>>;
}

export declare interface DifferentSpreadModelArrayRecord {
    "knownProp": string;
    "additionalProperties"?: Record<string, Array<ModelForRecord>>;
}

export declare interface DifferentSpreadModelDerived extends DifferentSpreadModelRecord {
    "derivedProp": ModelForRecord;
    "additionalProperties"?: Record<string, ModelForRecord>;
}

export declare interface DifferentSpreadModelRecord {
    "knownProp": string;
    "additionalProperties"?: Record<string, ModelForRecord>;
}

export declare interface DifferentSpreadStringDerived extends DifferentSpreadStringRecord {
    "derivedProp": string;
    "additionalProperties"?: Record<string, string>;
}

export declare interface DifferentSpreadStringRecord {
    "id": number;
    "additionalProperties"?: Record<string, string>;
}

export declare function encodeUint8Array(value: Uint8Array | undefined | null, encoding: BufferEncoding): string | undefined;

export declare class ExtendsDifferentSpreadFloatClient {
    #private;
    constructor(options?: ExtendsDifferentSpreadFloatClientOptions);
    get(options?: GetOptions_24): Promise<DifferentSpreadFloatDerived>;
    put(body: DifferentSpreadFloatDerived, options?: PutOptions_24): Promise<void>;
}

declare interface ExtendsDifferentSpreadFloatClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare class ExtendsDifferentSpreadModelArrayClient {
    #private;
    constructor(options?: ExtendsDifferentSpreadModelArrayClientOptions);
    get(options?: GetOptions_26): Promise<DifferentSpreadModelArrayDerived>;
    put(body: DifferentSpreadModelArrayDerived, options?: PutOptions_26): Promise<void>;
}

declare interface ExtendsDifferentSpreadModelArrayClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare class ExtendsDifferentSpreadModelClient {
    #private;
    constructor(options?: ExtendsDifferentSpreadModelClientOptions);
    get(options?: GetOptions_25): Promise<DifferentSpreadModelDerived>;
    put(body: DifferentSpreadModelDerived, options?: PutOptions_25): Promise<void>;
}

declare interface ExtendsDifferentSpreadModelClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare class ExtendsDifferentSpreadStringClient {
    #private;
    constructor(options?: ExtendsDifferentSpreadStringClientOptions);
    get(options?: GetOptions_23): Promise<DifferentSpreadStringDerived>;
    put(body: DifferentSpreadStringDerived, options?: PutOptions_23): Promise<void>;
}

declare interface ExtendsDifferentSpreadStringClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare interface ExtendsFloatAdditionalProperties {
    "id": number;
    "additionalProperties"?: Record<string, number>;
}

export declare class ExtendsFloatClient {
    #private;
    constructor(options?: ExtendsFloatClientOptions);
    get(options?: GetOptions_10): Promise<ExtendsFloatAdditionalProperties>;
    put(body: ExtendsFloatAdditionalProperties, options?: PutOptions_10): Promise<void>;
}

declare interface ExtendsFloatClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare interface ExtendsModelAdditionalProperties {
    "knownProp": ModelForRecord;
    "additionalProperties"?: Record<string, ModelForRecord>;
}

export declare interface ExtendsModelArrayAdditionalProperties {
    "knownProp": Array<ModelForRecord>;
    "additionalProperties"?: Record<string, Array<ModelForRecord>>;
}

export declare class ExtendsModelArrayClient {
    #private;
    constructor(options?: ExtendsModelArrayClientOptions);
    get(options?: GetOptions_16): Promise<ExtendsModelArrayAdditionalProperties>;
    put(body: ExtendsModelArrayAdditionalProperties, options?: PutOptions_16): Promise<void>;
}

declare interface ExtendsModelArrayClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare class ExtendsModelClient {
    #private;
    constructor(options?: ExtendsModelClientOptions);
    get(options?: GetOptions_13): Promise<ExtendsModelAdditionalProperties>;
    put(body: ExtendsModelAdditionalProperties, options?: PutOptions_13): Promise<void>;
}

declare interface ExtendsModelClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare interface ExtendsStringAdditionalProperties {
    "name": string;
    "additionalProperties"?: Record<string, string>;
}

export declare class ExtendsStringClient {
    #private;
    constructor(options?: ExtendsStringClientOptions);
    get(options?: GetOptions_7): Promise<ExtendsStringAdditionalProperties>;
    put(body: ExtendsStringAdditionalProperties, options?: PutOptions_7): Promise<void>;
}

declare interface ExtendsStringClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare interface ExtendsUnknownAdditionalProperties {
    "name": string;
    "additionalProperties"?: Record<string, unknown>;
}

export declare interface ExtendsUnknownAdditionalPropertiesDerived extends ExtendsUnknownAdditionalProperties {
    "index": number;
    "age"?: number;
    "additionalProperties"?: Record<string, unknown>;
}

export declare interface ExtendsUnknownAdditionalPropertiesDiscriminated {
    "name": string;
    "kind": string;
    "additionalProperties"?: Record<string, unknown>;
}

export declare interface ExtendsUnknownAdditionalPropertiesDiscriminatedDerived extends ExtendsUnknownAdditionalPropertiesDiscriminated {
    "kind": "derived";
    "index": number;
    "age"?: number;
    "additionalProperties"?: Record<string, unknown>;
}

export declare class ExtendsUnknownClient {
    #private;
    constructor(options?: ExtendsUnknownClientOptions);
    get(options?: GetOptions): Promise<ExtendsUnknownAdditionalProperties>;
    put(body: ExtendsUnknownAdditionalProperties, options?: PutOptions): Promise<void>;
}

declare interface ExtendsUnknownClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare class ExtendsUnknownDerivedClient {
    #private;
    constructor(options?: ExtendsUnknownDerivedClientOptions);
    get(options?: GetOptions_2): Promise<ExtendsUnknownAdditionalPropertiesDerived>;
    put(body: ExtendsUnknownAdditionalPropertiesDerived, options?: PutOptions_2): Promise<void>;
}

declare interface ExtendsUnknownDerivedClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare class ExtendsUnknownDiscriminatedClient {
    #private;
    constructor(options?: ExtendsUnknownDiscriminatedClientOptions);
    get(options?: GetOptions_3): Promise<ExtendsUnknownAdditionalPropertiesDiscriminated>;
    put(body: ExtendsUnknownAdditionalPropertiesDiscriminated, options?: PutOptions_3): Promise<void>;
}

declare interface ExtendsUnknownDiscriminatedClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare type Float = number;

export declare type Float32 = number;

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

declare interface GetOptions_30 extends OperationOptions {
}

declare interface GetOptions_31 extends OperationOptions {
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

export declare type Int32 = number;

export declare type Int64 = bigint;

export declare type Integer = number;

export declare interface IsFloatAdditionalProperties {
    "id": number;
    "additionalProperties"?: Record<string, number>;
}

export declare class IsFloatClient {
    #private;
    constructor(options?: IsFloatClientOptions);
    get(options?: GetOptions_11): Promise<IsFloatAdditionalProperties>;
    put(body: IsFloatAdditionalProperties, options?: PutOptions_11): Promise<void>;
}

declare interface IsFloatClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare interface IsModelAdditionalProperties {
    "knownProp": ModelForRecord;
    "additionalProperties"?: Record<string, ModelForRecord>;
}

export declare interface IsModelArrayAdditionalProperties {
    "knownProp": Array<ModelForRecord>;
    "additionalProperties"?: Record<string, Array<ModelForRecord>>;
}

export declare class IsModelArrayClient {
    #private;
    constructor(options?: IsModelArrayClientOptions);
    get(options?: GetOptions_17): Promise<IsModelArrayAdditionalProperties>;
    put(body: IsModelArrayAdditionalProperties, options?: PutOptions_17): Promise<void>;
}

declare interface IsModelArrayClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare class IsModelClient {
    #private;
    constructor(options?: IsModelClientOptions);
    get(options?: GetOptions_14): Promise<IsModelAdditionalProperties>;
    put(body: IsModelAdditionalProperties, options?: PutOptions_14): Promise<void>;
}

declare interface IsModelClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare interface IsStringAdditionalProperties {
    "name": string;
    "additionalProperties"?: Record<string, string>;
}

export declare class IsStringClient {
    #private;
    constructor(options?: IsStringClientOptions);
    get(options?: GetOptions_8): Promise<IsStringAdditionalProperties>;
    put(body: IsStringAdditionalProperties, options?: PutOptions_8): Promise<void>;
}

declare interface IsStringClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare interface IsUnknownAdditionalProperties {
    "name": string;
    "additionalProperties"?: Record<string, unknown>;
}

export declare interface IsUnknownAdditionalPropertiesDerived extends IsUnknownAdditionalProperties {
    "index": number;
    "age"?: number;
    "additionalProperties"?: Record<string, unknown>;
}

export declare interface IsUnknownAdditionalPropertiesDiscriminated {
    "name": string;
    "kind": string;
    "additionalProperties"?: Record<string, unknown>;
}

export declare interface IsUnknownAdditionalPropertiesDiscriminatedDerived extends IsUnknownAdditionalPropertiesDiscriminated {
    "kind": "derived";
    "index": number;
    "age"?: number;
    "additionalProperties"?: Record<string, unknown>;
}

export declare class IsUnknownClient {
    #private;
    constructor(options?: IsUnknownClientOptions);
    get(options?: GetOptions_4): Promise<IsUnknownAdditionalProperties>;
    put(body: IsUnknownAdditionalProperties, options?: PutOptions_4): Promise<void>;
}

declare interface IsUnknownClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare class IsUnknownDerivedClient {
    #private;
    constructor(options?: IsUnknownDerivedClientOptions);
    get(options?: GetOptions_5): Promise<IsUnknownAdditionalPropertiesDerived>;
    put(body: IsUnknownAdditionalPropertiesDerived, options?: PutOptions_5): Promise<void>;
}

declare interface IsUnknownDerivedClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare class IsUnknownDiscriminatedClient {
    #private;
    constructor(options?: IsUnknownDiscriminatedClientOptions);
    get(options?: GetOptions_6): Promise<IsUnknownAdditionalPropertiesDiscriminated>;
    put(body: IsUnknownAdditionalPropertiesDiscriminated, options?: PutOptions_6): Promise<void>;
}

declare interface IsUnknownDiscriminatedClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare function jsonArrayModelForRecordToApplicationTransform(items_?: any): Array<ModelForRecord>;

export declare function jsonArrayModelForRecordToTransportTransform(items_?: Array<ModelForRecord> | null): any;

export declare function jsonArrayWidgetData2ToApplicationTransform(items_?: any): Array<WidgetData2>;

export declare function jsonArrayWidgetData2ToTransportTransform(items_?: Array<WidgetData2> | null): any;

export declare function jsonDifferentSpreadFloatDerivedToApplicationTransform(input_?: any): DifferentSpreadFloatDerived;

export declare function jsonDifferentSpreadFloatDerivedToTransportTransform(input_?: DifferentSpreadFloatDerived | null): any;

export declare function jsonDifferentSpreadFloatRecordToApplicationTransform(input_?: any): DifferentSpreadFloatRecord;

export declare function jsonDifferentSpreadFloatRecordToTransportTransform(input_?: DifferentSpreadFloatRecord | null): any;

export declare function jsonDifferentSpreadModelArrayDerivedToApplicationTransform(input_?: any): DifferentSpreadModelArrayDerived;

export declare function jsonDifferentSpreadModelArrayDerivedToTransportTransform(input_?: DifferentSpreadModelArrayDerived | null): any;

export declare function jsonDifferentSpreadModelArrayRecordToApplicationTransform(input_?: any): DifferentSpreadModelArrayRecord;

export declare function jsonDifferentSpreadModelArrayRecordToTransportTransform(input_?: DifferentSpreadModelArrayRecord | null): any;

export declare function jsonDifferentSpreadModelDerivedToApplicationTransform(input_?: any): DifferentSpreadModelDerived;

export declare function jsonDifferentSpreadModelDerivedToTransportTransform(input_?: DifferentSpreadModelDerived | null): any;

export declare function jsonDifferentSpreadModelRecordToApplicationTransform(input_?: any): DifferentSpreadModelRecord;

export declare function jsonDifferentSpreadModelRecordToTransportTransform(input_?: DifferentSpreadModelRecord | null): any;

export declare function jsonDifferentSpreadStringDerivedToApplicationTransform(input_?: any): DifferentSpreadStringDerived;

export declare function jsonDifferentSpreadStringDerivedToTransportTransform(input_?: DifferentSpreadStringDerived | null): any;

export declare function jsonDifferentSpreadStringRecordToApplicationTransform(input_?: any): DifferentSpreadStringRecord;

export declare function jsonDifferentSpreadStringRecordToTransportTransform(input_?: DifferentSpreadStringRecord | null): any;

export declare function jsonExtendsFloatAdditionalPropertiesToApplicationTransform(input_?: any): ExtendsFloatAdditionalProperties;

export declare function jsonExtendsFloatAdditionalPropertiesToTransportTransform(input_?: ExtendsFloatAdditionalProperties | null): any;

export declare function jsonExtendsModelAdditionalPropertiesToApplicationTransform(input_?: any): ExtendsModelAdditionalProperties;

export declare function jsonExtendsModelAdditionalPropertiesToTransportTransform(input_?: ExtendsModelAdditionalProperties | null): any;

export declare function jsonExtendsModelArrayAdditionalPropertiesToApplicationTransform(input_?: any): ExtendsModelArrayAdditionalProperties;

export declare function jsonExtendsModelArrayAdditionalPropertiesToTransportTransform(input_?: ExtendsModelArrayAdditionalProperties | null): any;

export declare function jsonExtendsStringAdditionalPropertiesToApplicationTransform(input_?: any): ExtendsStringAdditionalProperties;

export declare function jsonExtendsStringAdditionalPropertiesToTransportTransform(input_?: ExtendsStringAdditionalProperties | null): any;

export declare function jsonExtendsUnknownAdditionalPropertiesDerivedToApplicationTransform(input_?: any): ExtendsUnknownAdditionalPropertiesDerived;

export declare function jsonExtendsUnknownAdditionalPropertiesDerivedToTransportTransform(input_?: ExtendsUnknownAdditionalPropertiesDerived | null): any;

export declare function jsonExtendsUnknownAdditionalPropertiesDiscriminatedDerivedToApplicationTransform(input_?: any): ExtendsUnknownAdditionalPropertiesDiscriminatedDerived;

export declare function jsonExtendsUnknownAdditionalPropertiesDiscriminatedDerivedToTransportTransform(input_?: ExtendsUnknownAdditionalPropertiesDiscriminatedDerived | null): any;

export declare function jsonExtendsUnknownAdditionalPropertiesDiscriminatedToApplicationDiscriminator(input_?: any): ExtendsUnknownAdditionalPropertiesDiscriminated;

export declare function jsonExtendsUnknownAdditionalPropertiesDiscriminatedToApplicationTransform(input_?: any): ExtendsUnknownAdditionalPropertiesDiscriminated;

export declare function jsonExtendsUnknownAdditionalPropertiesDiscriminatedToTransportDiscriminator(input_?: ExtendsUnknownAdditionalPropertiesDiscriminated): any;

export declare function jsonExtendsUnknownAdditionalPropertiesDiscriminatedToTransportTransform(input_?: ExtendsUnknownAdditionalPropertiesDiscriminated | null): any;

export declare function jsonExtendsUnknownAdditionalPropertiesToApplicationTransform(input_?: any): ExtendsUnknownAdditionalProperties;

export declare function jsonExtendsUnknownAdditionalPropertiesToTransportTransform(input_?: ExtendsUnknownAdditionalProperties | null): any;

export declare function jsonIsFloatAdditionalPropertiesToApplicationTransform(input_?: any): IsFloatAdditionalProperties;

export declare function jsonIsFloatAdditionalPropertiesToTransportTransform(input_?: IsFloatAdditionalProperties | null): any;

export declare function jsonIsModelAdditionalPropertiesToApplicationTransform(input_?: any): IsModelAdditionalProperties;

export declare function jsonIsModelAdditionalPropertiesToTransportTransform(input_?: IsModelAdditionalProperties | null): any;

export declare function jsonIsModelArrayAdditionalPropertiesToApplicationTransform(input_?: any): IsModelArrayAdditionalProperties;

export declare function jsonIsModelArrayAdditionalPropertiesToTransportTransform(input_?: IsModelArrayAdditionalProperties | null): any;

export declare function jsonIsStringAdditionalPropertiesToApplicationTransform(input_?: any): IsStringAdditionalProperties;

export declare function jsonIsStringAdditionalPropertiesToTransportTransform(input_?: IsStringAdditionalProperties | null): any;

export declare function jsonIsUnknownAdditionalPropertiesDerivedToApplicationTransform(input_?: any): IsUnknownAdditionalPropertiesDerived;

export declare function jsonIsUnknownAdditionalPropertiesDerivedToTransportTransform(input_?: IsUnknownAdditionalPropertiesDerived | null): any;

export declare function jsonIsUnknownAdditionalPropertiesDiscriminatedDerivedToApplicationTransform(input_?: any): IsUnknownAdditionalPropertiesDiscriminatedDerived;

export declare function jsonIsUnknownAdditionalPropertiesDiscriminatedDerivedToTransportTransform(input_?: IsUnknownAdditionalPropertiesDiscriminatedDerived | null): any;

export declare function jsonIsUnknownAdditionalPropertiesDiscriminatedToApplicationDiscriminator(input_?: any): IsUnknownAdditionalPropertiesDiscriminated;

export declare function jsonIsUnknownAdditionalPropertiesDiscriminatedToApplicationTransform(input_?: any): IsUnknownAdditionalPropertiesDiscriminated;

export declare function jsonIsUnknownAdditionalPropertiesDiscriminatedToTransportDiscriminator(input_?: IsUnknownAdditionalPropertiesDiscriminated): any;

export declare function jsonIsUnknownAdditionalPropertiesDiscriminatedToTransportTransform(input_?: IsUnknownAdditionalPropertiesDiscriminated | null): any;

export declare function jsonIsUnknownAdditionalPropertiesToApplicationTransform(input_?: any): IsUnknownAdditionalProperties;

export declare function jsonIsUnknownAdditionalPropertiesToTransportTransform(input_?: IsUnknownAdditionalProperties | null): any;

export declare function jsonModelForRecordToApplicationTransform(input_?: any): ModelForRecord;

export declare function jsonModelForRecordToTransportTransform(input_?: ModelForRecord | null): any;

export declare function jsonMultipleSpreadRecordToApplicationTransform(input_?: any): MultipleSpreadRecord;

export declare function jsonMultipleSpreadRecordToTransportTransform(input_?: MultipleSpreadRecord | null): any;

export declare function jsonRecordArrayToApplicationTransform(items_?: any): Record<string, any>;

export declare function jsonRecordArrayToApplicationTransform_2(items_?: any): Record<string, any>;

export declare function jsonRecordArrayToApplicationTransform_3(items_?: any): Record<string, any>;

export declare function jsonRecordArrayToApplicationTransform_4(items_?: any): Record<string, any>;

export declare function jsonRecordArrayToTransportTransform(items_?: Record<string, any> | null): any;

export declare function jsonRecordArrayToTransportTransform_2(items_?: Record<string, any> | null): any;

export declare function jsonRecordArrayToTransportTransform_3(items_?: Record<string, any> | null): any;

export declare function jsonRecordArrayToTransportTransform_4(items_?: Record<string, any> | null): any;

export declare function jsonRecordElementToApplicationTransform(items_?: any): Record<string, any>;

export declare function jsonRecordElementToApplicationTransform_2(items_?: any): Record<string, any>;

export declare function jsonRecordElementToApplicationTransform_3(items_?: any): Record<string, any>;

export declare function jsonRecordElementToApplicationTransform_4(items_?: any): Record<string, any>;

export declare function jsonRecordElementToApplicationTransform_5(items_?: any): Record<string, any>;

export declare function jsonRecordElementToTransportTransform(items_?: Record<string, any> | null): any;

export declare function jsonRecordElementToTransportTransform_2(items_?: Record<string, any> | null): any;

export declare function jsonRecordElementToTransportTransform_3(items_?: Record<string, any> | null): any;

export declare function jsonRecordElementToTransportTransform_4(items_?: Record<string, any> | null): any;

export declare function jsonRecordElementToTransportTransform_5(items_?: Record<string, any> | null): any;

export declare function jsonRecordFloat32ToApplicationTransform(items_?: any): Record<string, any>;

export declare function jsonRecordFloat32ToApplicationTransform_2(items_?: any): Record<string, any>;

export declare function jsonRecordFloat32ToApplicationTransform_3(items_?: any): Record<string, any>;

export declare function jsonRecordFloat32ToApplicationTransform_4(items_?: any): Record<string, any>;

export declare function jsonRecordFloat32ToTransportTransform(items_?: Record<string, any> | null): any;

export declare function jsonRecordFloat32ToTransportTransform_2(items_?: Record<string, any> | null): any;

export declare function jsonRecordFloat32ToTransportTransform_3(items_?: Record<string, any> | null): any;

export declare function jsonRecordFloat32ToTransportTransform_4(items_?: Record<string, any> | null): any;

export declare function jsonRecordModelForRecordToApplicationTransform(items_?: any): Record<string, any>;

export declare function jsonRecordModelForRecordToApplicationTransform_2(items_?: any): Record<string, any>;

export declare function jsonRecordModelForRecordToApplicationTransform_3(items_?: any): Record<string, any>;

export declare function jsonRecordModelForRecordToApplicationTransform_4(items_?: any): Record<string, any>;

export declare function jsonRecordModelForRecordToTransportTransform(items_?: Record<string, any> | null): any;

export declare function jsonRecordModelForRecordToTransportTransform_2(items_?: Record<string, any> | null): any;

export declare function jsonRecordModelForRecordToTransportTransform_3(items_?: Record<string, any> | null): any;

export declare function jsonRecordModelForRecordToTransportTransform_4(items_?: Record<string, any> | null): any;

export declare function jsonRecordStringToApplicationTransform(items_?: any): Record<string, any>;

export declare function jsonRecordStringToApplicationTransform_2(items_?: any): Record<string, any>;

export declare function jsonRecordStringToApplicationTransform_3(items_?: any): Record<string, any>;

export declare function jsonRecordStringToApplicationTransform_4(items_?: any): Record<string, any>;

export declare function jsonRecordStringToTransportTransform(items_?: Record<string, any> | null): any;

export declare function jsonRecordStringToTransportTransform_2(items_?: Record<string, any> | null): any;

export declare function jsonRecordStringToTransportTransform_3(items_?: Record<string, any> | null): any;

export declare function jsonRecordStringToTransportTransform_4(items_?: Record<string, any> | null): any;

export declare function jsonRecordUnknownToApplicationTransform(items_?: any): Record<string, any>;

export declare function jsonRecordUnknownToApplicationTransform_2(items_?: any): Record<string, any>;

export declare function jsonRecordUnknownToApplicationTransform_3(items_?: any): Record<string, any>;

export declare function jsonRecordUnknownToTransportTransform(items_?: Record<string, any> | null): any;

export declare function jsonRecordUnknownToTransportTransform_2(items_?: Record<string, any> | null): any;

export declare function jsonRecordUnknownToTransportTransform_3(items_?: Record<string, any> | null): any;

export declare function jsonSpreadFloatRecordToApplicationTransform(input_?: any): SpreadFloatRecord;

export declare function jsonSpreadFloatRecordToTransportTransform(input_?: SpreadFloatRecord | null): any;

export declare function jsonSpreadModelArrayRecordToApplicationTransform(input_?: any): SpreadModelArrayRecord;

export declare function jsonSpreadModelArrayRecordToTransportTransform(input_?: SpreadModelArrayRecord | null): any;

export declare function jsonSpreadModelRecordToApplicationTransform(input_?: any): SpreadModelRecord;

export declare function jsonSpreadModelRecordToTransportTransform(input_?: SpreadModelRecord | null): any;

export declare function jsonSpreadRecordForNonDiscriminatedUnion2ToApplicationTransform(input_?: any): SpreadRecordForNonDiscriminatedUnion2;

export declare function jsonSpreadRecordForNonDiscriminatedUnion2ToTransportTransform(input_?: SpreadRecordForNonDiscriminatedUnion2 | null): any;

export declare function jsonSpreadRecordForNonDiscriminatedUnion3ToApplicationTransform(input_?: any): SpreadRecordForNonDiscriminatedUnion3;

export declare function jsonSpreadRecordForNonDiscriminatedUnion3ToTransportTransform(input_?: SpreadRecordForNonDiscriminatedUnion3 | null): any;

export declare function jsonSpreadRecordForNonDiscriminatedUnionToApplicationTransform(input_?: any): SpreadRecordForNonDiscriminatedUnion;

export declare function jsonSpreadRecordForNonDiscriminatedUnionToTransportTransform(input_?: SpreadRecordForNonDiscriminatedUnion | null): any;

export declare function jsonSpreadRecordForUnionToApplicationTransform(input_?: any): SpreadRecordForUnion;

export declare function jsonSpreadRecordForUnionToTransportTransform(input_?: SpreadRecordForUnion | null): any;

export declare function jsonSpreadStringRecordToApplicationTransform(input_?: any): SpreadStringRecord;

export declare function jsonSpreadStringRecordToTransportTransform(input_?: SpreadStringRecord | null): any;

export declare function jsonWidgetData0ToApplicationTransform(input_?: any): WidgetData0;

export declare function jsonWidgetData0ToTransportTransform(input_?: WidgetData0 | null): any;

export declare function jsonWidgetData1ToApplicationTransform(input_?: any): WidgetData1;

export declare function jsonWidgetData1ToTransportTransform(input_?: WidgetData1 | null): any;

export declare function jsonWidgetData2ToApplicationTransform(input_?: any): WidgetData2;

export declare function jsonWidgetData2ToTransportTransform(input_?: WidgetData2 | null): any;

export declare interface ModelForRecord {
    "state": string;
}

export declare class ModelOperationsClient {
    #private;
    constructor(options?: ModelOperationsClientOptions);
}

declare interface ModelOperationsClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare class MultipleSpreadClient {
    #private;
    constructor(options?: MultipleSpreadClientOptions);
    get(options?: GetOptions_27): Promise<MultipleSpreadRecord>;
    put(body: MultipleSpreadRecord, options?: PutOptions_27): Promise<void>;
}

declare interface MultipleSpreadClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare interface MultipleSpreadRecord {
    "flag": boolean;
    "additionalProperties"?: Record<string, string | number>;
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

declare interface PutOptions_30 extends OperationOptions {
}

declare interface PutOptions_31 extends OperationOptions {
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

export declare function putPayloadToTransport(payload: SpreadRecordForNonDiscriminatedUnion3): any;

export declare function putPayloadToTransport_10(payload: DifferentSpreadModelArrayRecord): any;

export declare function putPayloadToTransport_11(payload: DifferentSpreadModelRecord): any;

export declare function putPayloadToTransport_12(payload: DifferentSpreadFloatRecord): any;

export declare function putPayloadToTransport_13(payload: DifferentSpreadStringRecord): any;

export declare function putPayloadToTransport_14(payload: SpreadModelArrayRecord): any;

export declare function putPayloadToTransport_15(payload: IsModelArrayAdditionalProperties): any;

export declare function putPayloadToTransport_16(payload: ExtendsModelArrayAdditionalProperties): any;

export declare function putPayloadToTransport_17(payload: SpreadModelRecord): any;

export declare function putPayloadToTransport_18(payload: IsModelAdditionalProperties): any;

export declare function putPayloadToTransport_19(payload: ExtendsModelAdditionalProperties): any;

export declare function putPayloadToTransport_2(payload: SpreadRecordForNonDiscriminatedUnion2): any;

export declare function putPayloadToTransport_20(payload: SpreadFloatRecord): any;

export declare function putPayloadToTransport_21(payload: IsFloatAdditionalProperties): any;

export declare function putPayloadToTransport_22(payload: ExtendsFloatAdditionalProperties): any;

export declare function putPayloadToTransport_23(payload: SpreadStringRecord): any;

export declare function putPayloadToTransport_24(payload: IsStringAdditionalProperties): any;

export declare function putPayloadToTransport_25(payload: ExtendsStringAdditionalProperties): any;

export declare function putPayloadToTransport_26(payload: IsUnknownAdditionalPropertiesDiscriminated): any;

export declare function putPayloadToTransport_27(payload: IsUnknownAdditionalPropertiesDerived): any;

export declare function putPayloadToTransport_28(payload: IsUnknownAdditionalProperties): any;

export declare function putPayloadToTransport_29(payload: ExtendsUnknownAdditionalPropertiesDiscriminated): any;

export declare function putPayloadToTransport_3(payload: SpreadRecordForNonDiscriminatedUnion): any;

export declare function putPayloadToTransport_30(payload: ExtendsUnknownAdditionalPropertiesDerived): any;

export declare function putPayloadToTransport_31(payload: ExtendsUnknownAdditionalProperties): any;

export declare function putPayloadToTransport_4(payload: SpreadRecordForUnion): any;

export declare function putPayloadToTransport_5(payload: MultipleSpreadRecord): any;

export declare function putPayloadToTransport_6(payload: DifferentSpreadModelArrayDerived): any;

export declare function putPayloadToTransport_7(payload: DifferentSpreadModelDerived): any;

export declare function putPayloadToTransport_8(payload: DifferentSpreadFloatDerived): any;

export declare function putPayloadToTransport_9(payload: DifferentSpreadStringDerived): any;

export declare class SpreadDifferentFloatClient {
    #private;
    constructor(options?: SpreadDifferentFloatClientOptions);
    get(options?: GetOptions_20): Promise<DifferentSpreadFloatRecord>;
    put(body: DifferentSpreadFloatRecord, options?: PutOptions_20): Promise<void>;
}

declare interface SpreadDifferentFloatClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare class SpreadDifferentModelArrayClient {
    #private;
    constructor(options?: SpreadDifferentModelArrayClientOptions);
    get(options?: GetOptions_22): Promise<DifferentSpreadModelArrayRecord>;
    put(body: DifferentSpreadModelArrayRecord, options?: PutOptions_22): Promise<void>;
}

declare interface SpreadDifferentModelArrayClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare class SpreadDifferentModelClient {
    #private;
    constructor(options?: SpreadDifferentModelClientOptions);
    get(options?: GetOptions_21): Promise<DifferentSpreadModelRecord>;
    put(body: DifferentSpreadModelRecord, options?: PutOptions_21): Promise<void>;
}

declare interface SpreadDifferentModelClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare class SpreadDifferentStringClient {
    #private;
    constructor(options?: SpreadDifferentStringClientOptions);
    get(options?: GetOptions_19): Promise<DifferentSpreadStringRecord>;
    put(body: DifferentSpreadStringRecord, options?: PutOptions_19): Promise<void>;
}

declare interface SpreadDifferentStringClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare class SpreadFloatClient {
    #private;
    constructor(options?: SpreadFloatClientOptions);
    get(options?: GetOptions_12): Promise<SpreadFloatRecord>;
    put(body: SpreadFloatRecord, options?: PutOptions_12): Promise<void>;
}

declare interface SpreadFloatClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare interface SpreadFloatRecord {
    "id": number;
    "additionalProperties"?: Record<string, number>;
}

export declare class SpreadModelArrayClient {
    #private;
    constructor(options?: SpreadModelArrayClientOptions);
    get(options?: GetOptions_18): Promise<SpreadModelArrayRecord>;
    put(body: SpreadModelArrayRecord, options?: PutOptions_18): Promise<void>;
}

declare interface SpreadModelArrayClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare interface SpreadModelArrayRecord {
    "knownProp": Array<ModelForRecord>;
    "additionalProperties"?: Record<string, Array<ModelForRecord>>;
}

export declare class SpreadModelClient {
    #private;
    constructor(options?: SpreadModelClientOptions);
    get(options?: GetOptions_15): Promise<SpreadModelRecord>;
    put(body: SpreadModelRecord, options?: PutOptions_15): Promise<void>;
}

declare interface SpreadModelClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare interface SpreadModelRecord {
    "knownProp": ModelForRecord;
    "additionalProperties"?: Record<string, ModelForRecord>;
}

export declare interface SpreadRecordForNonDiscriminatedUnion {
    "name": string;
    "additionalProperties"?: Record<string, WidgetData0 | WidgetData1>;
}

export declare interface SpreadRecordForNonDiscriminatedUnion2 {
    "name": string;
    "additionalProperties"?: Record<string, WidgetData2 | WidgetData1>;
}

export declare interface SpreadRecordForNonDiscriminatedUnion3 {
    "name": string;
    "additionalProperties"?: Record<string, Array<WidgetData2> | WidgetData1>;
}

export declare interface SpreadRecordForUnion {
    "flag": boolean;
    "additionalProperties"?: Record<string, string | number>;
}

export declare class SpreadRecordNonDiscriminatedUnion2Client {
    #private;
    constructor(options?: SpreadRecordNonDiscriminatedUnion2ClientOptions);
    get(options?: GetOptions_30): Promise<SpreadRecordForNonDiscriminatedUnion2>;
    put(body: SpreadRecordForNonDiscriminatedUnion2, options?: PutOptions_30): Promise<void>;
}

declare interface SpreadRecordNonDiscriminatedUnion2ClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare class SpreadRecordNonDiscriminatedUnion3Client {
    #private;
    constructor(options?: SpreadRecordNonDiscriminatedUnion3ClientOptions);
    get(options?: GetOptions_31): Promise<SpreadRecordForNonDiscriminatedUnion3>;
    put(body: SpreadRecordForNonDiscriminatedUnion3, options?: PutOptions_31): Promise<void>;
}

declare interface SpreadRecordNonDiscriminatedUnion3ClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare class SpreadRecordNonDiscriminatedUnionClient {
    #private;
    constructor(options?: SpreadRecordNonDiscriminatedUnionClientOptions);
    get(options?: GetOptions_29): Promise<SpreadRecordForNonDiscriminatedUnion>;
    put(body: SpreadRecordForNonDiscriminatedUnion, options?: PutOptions_29): Promise<void>;
}

declare interface SpreadRecordNonDiscriminatedUnionClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare class SpreadRecordUnionClient {
    #private;
    constructor(options?: SpreadRecordUnionClientOptions);
    get(options?: GetOptions_28): Promise<SpreadRecordForUnion>;
    put(body: SpreadRecordForUnion, options?: PutOptions_28): Promise<void>;
}

declare interface SpreadRecordUnionClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare class SpreadStringClient {
    #private;
    constructor(options?: SpreadStringClientOptions);
    get(options?: GetOptions_9): Promise<SpreadStringRecord>;
    put(body: SpreadStringRecord, options?: PutOptions_9): Promise<void>;
}

declare interface SpreadStringClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare interface SpreadStringRecord {
    "name": string;
    "additionalProperties"?: Record<string, string>;
}

declare type String_2 = string;
export { String_2 as String }

export declare type UtcDateTime = Date;

export declare interface WidgetData0 {
    "kind": "kind0";
    "fooProp": string;
}

export declare interface WidgetData1 {
    "kind": "kind1";
    "start": Date;
    "end"?: Date;
}

export declare interface WidgetData2 {
    "kind": "kind1";
    "start": string;
}

export { }
