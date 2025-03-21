import { ClientOptions } from '@typespec/ts-http-runtime';
import { PathUncheckedResponse } from '@typespec/ts-http-runtime';

export declare type Bytes = Uint8Array;

export declare class BytesClient {
    #private;
    constructor(options?: BytesClientOptions);
    getNonNull(options?: GetNonNullOptions_2): Promise<BytesProperty>;
    getNull(options?: GetNullOptions_2): Promise<BytesProperty>;
    patchNonNull(body: BytesProperty, options?: PatchNonNullOptions_2): Promise<void>;
    patchNull(body: BytesProperty, options?: PatchNullOptions_2): Promise<void>;
}

declare interface BytesClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare interface BytesProperty {
    "requiredProperty": string;
    "nullableProperty": Uint8Array | null;
}

export declare class CollectionsByteClient {
    #private;
    constructor(options?: CollectionsByteClientOptions);
    getNonNull(options?: GetNonNullOptions_5): Promise<CollectionsByteProperty>;
    getNull(options?: GetNullOptions_5): Promise<CollectionsByteProperty>;
    patchNonNull(body: CollectionsByteProperty, options?: PatchNonNullOptions_5): Promise<void>;
    patchNull(body: CollectionsByteProperty, options?: PatchNullOptions_5): Promise<void>;
}

declare interface CollectionsByteClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare interface CollectionsByteProperty {
    "requiredProperty": string;
    "nullableProperty": Array<Uint8Array> | null;
}

export declare class CollectionsModelClient {
    #private;
    constructor(options?: CollectionsModelClientOptions);
    getNonNull(options?: GetNonNullOptions_6): Promise<CollectionsModelProperty>;
    getNull(options?: GetNullOptions_6): Promise<CollectionsModelProperty>;
    patchNonNull(body: CollectionsModelProperty, options?: PatchNonNullOptions_6): Promise<void>;
    patchNull(body: CollectionsModelProperty, options?: PatchNullOptions_6): Promise<void>;
}

declare interface CollectionsModelClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare interface CollectionsModelProperty {
    "requiredProperty": string;
    "nullableProperty": Array<InnerModel> | null;
}

export declare class CollectionsStringClient {
    #private;
    constructor(options?: CollectionsStringClientOptions);
    getNonNull(options?: GetNonNullOptions_7): Promise<CollectionsStringProperty>;
    getNull(options?: GetNullOptions_7): Promise<CollectionsStringProperty>;
    patchNonNull(body: CollectionsStringProperty, options?: PatchNonNullOptions_7): Promise<void>;
    patchNull(body: CollectionsStringProperty, options?: PatchNullOptions_7): Promise<void>;
}

declare interface CollectionsStringClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare interface CollectionsStringProperty {
    "requiredProperty": string;
    "nullableProperty": Array<string> | null;
}

export declare function dateDeserializer(date?: string | null): Date;

export declare function dateRfc3339Serializer(date?: Date | null): string;

export declare function dateRfc7231Deserializer(date?: string | null): Date;

export declare function dateRfc7231Serializer(date?: Date | null): string;

export declare class DatetimeClient {
    #private;
    constructor(options?: DatetimeClientOptions);
    getNonNull(options?: GetNonNullOptions_3): Promise<DatetimeProperty>;
    getNull(options?: GetNullOptions_3): Promise<DatetimeProperty>;
    patchNonNull(body: DatetimeProperty, options?: PatchNonNullOptions_3): Promise<void>;
    patchNull(body: DatetimeProperty, options?: PatchNullOptions_3): Promise<void>;
}

declare interface DatetimeClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare interface DatetimeProperty {
    "requiredProperty": string;
    "nullableProperty": Date | null;
}

export declare function dateUnixTimestampDeserializer(date?: number | null): Date;

export declare function dateUnixTimestampSerializer(date?: Date | null): number;

export declare function decodeBase64(value: string): Uint8Array | undefined;

export declare type Duration = string;

export declare class DurationClient {
    #private;
    constructor(options?: DurationClientOptions);
    getNonNull(options?: GetNonNullOptions_4): Promise<DurationProperty>;
    getNull(options?: GetNullOptions_4): Promise<DurationProperty>;
    patchNonNull(body: DurationProperty, options?: PatchNonNullOptions_4): Promise<void>;
    patchNull(body: DurationProperty, options?: PatchNullOptions_4): Promise<void>;
}

declare interface DurationClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare interface DurationProperty {
    "requiredProperty": string;
    "nullableProperty": string | null;
}

export declare function encodeUint8Array(value: Uint8Array | undefined | null, encoding: BufferEncoding): string | undefined;

declare interface GetNonNullOptions extends OperationOptions {
}

declare interface GetNonNullOptions_2 extends OperationOptions {
}

declare interface GetNonNullOptions_3 extends OperationOptions {
}

declare interface GetNonNullOptions_4 extends OperationOptions {
}

declare interface GetNonNullOptions_5 extends OperationOptions {
}

declare interface GetNonNullOptions_6 extends OperationOptions {
}

declare interface GetNonNullOptions_7 extends OperationOptions {
}

declare interface GetNullOptions extends OperationOptions {
}

declare interface GetNullOptions_2 extends OperationOptions {
}

declare interface GetNullOptions_3 extends OperationOptions {
}

declare interface GetNullOptions_4 extends OperationOptions {
}

declare interface GetNullOptions_5 extends OperationOptions {
}

declare interface GetNullOptions_6 extends OperationOptions {
}

declare interface GetNullOptions_7 extends OperationOptions {
}

export declare interface InnerModel {
    "property": string;
}

export declare function jsonArrayBytesToApplicationTransform(items_?: any): Array<Uint8Array>;

export declare function jsonArrayBytesToTransportTransform(items_?: Array<Uint8Array> | null): any;

export declare function jsonArrayInnerModelToApplicationTransform(items_?: any): Array<InnerModel>;

export declare function jsonArrayInnerModelToTransportTransform(items_?: Array<InnerModel> | null): any;

export declare function jsonArrayStringToApplicationTransform(items_?: any): Array<string>;

export declare function jsonArrayStringToTransportTransform(items_?: Array<string> | null): any;

export declare function jsonBytesPropertyToApplicationTransform(input_?: any): BytesProperty;

export declare function jsonBytesPropertyToTransportTransform(input_?: BytesProperty | null): any;

export declare function jsonCollectionsBytePropertyToApplicationTransform(input_?: any): CollectionsByteProperty;

export declare function jsonCollectionsBytePropertyToTransportTransform(input_?: CollectionsByteProperty | null): any;

export declare function jsonCollectionsModelPropertyToApplicationTransform(input_?: any): CollectionsModelProperty;

export declare function jsonCollectionsModelPropertyToTransportTransform(input_?: CollectionsModelProperty | null): any;

export declare function jsonCollectionsStringPropertyToApplicationTransform(input_?: any): CollectionsStringProperty;

export declare function jsonCollectionsStringPropertyToTransportTransform(input_?: CollectionsStringProperty | null): any;

export declare function jsonDatetimePropertyToApplicationTransform(input_?: any): DatetimeProperty;

export declare function jsonDatetimePropertyToTransportTransform(input_?: DatetimeProperty | null): any;

export declare function jsonDurationPropertyToApplicationTransform(input_?: any): DurationProperty;

export declare function jsonDurationPropertyToTransportTransform(input_?: DurationProperty | null): any;

export declare function jsonInnerModelToApplicationTransform(input_?: any): InnerModel;

export declare function jsonInnerModelToTransportTransform(input_?: InnerModel | null): any;

export declare function jsonStringPropertyToApplicationTransform(input_?: any): StringProperty;

export declare function jsonStringPropertyToTransportTransform(input_?: StringProperty | null): any;

export declare class NullableClient {
    #private;
    operationsTemplateClient: OperationsTemplateClient;
    stringClient: StringClient;
    bytesClient: BytesClient;
    datetimeClient: DatetimeClient;
    durationClient: DurationClient;
    collectionsByteClient: CollectionsByteClient;
    collectionsModelClient: CollectionsModelClient;
    collectionsStringClient: CollectionsStringClient;
    constructor(options?: NullableClientOptions);
}

declare interface NullableClientOptions extends ClientOptions {
    endpoint?: string;
}

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

declare interface PatchNonNullOptions extends OperationOptions {
    contentType?: "application/merge-patch+json";
}

declare interface PatchNonNullOptions_2 extends OperationOptions {
    contentType?: "application/merge-patch+json";
}

declare interface PatchNonNullOptions_3 extends OperationOptions {
    contentType?: "application/merge-patch+json";
}

declare interface PatchNonNullOptions_4 extends OperationOptions {
    contentType?: "application/merge-patch+json";
}

declare interface PatchNonNullOptions_5 extends OperationOptions {
    contentType?: "application/merge-patch+json";
}

declare interface PatchNonNullOptions_6 extends OperationOptions {
    contentType?: "application/merge-patch+json";
}

declare interface PatchNonNullOptions_7 extends OperationOptions {
    contentType?: "application/merge-patch+json";
}

export declare function patchNonNullPayloadToTransport(payload: CollectionsStringProperty): any;

export declare function patchNonNullPayloadToTransport_2(payload: CollectionsModelProperty): any;

export declare function patchNonNullPayloadToTransport_3(payload: CollectionsByteProperty): any;

export declare function patchNonNullPayloadToTransport_4(payload: DurationProperty): any;

export declare function patchNonNullPayloadToTransport_5(payload: DatetimeProperty): any;

export declare function patchNonNullPayloadToTransport_6(payload: BytesProperty): any;

export declare function patchNonNullPayloadToTransport_7(payload: StringProperty): any;

declare interface PatchNullOptions extends OperationOptions {
    contentType?: "application/merge-patch+json";
}

declare interface PatchNullOptions_2 extends OperationOptions {
    contentType?: "application/merge-patch+json";
}

declare interface PatchNullOptions_3 extends OperationOptions {
    contentType?: "application/merge-patch+json";
}

declare interface PatchNullOptions_4 extends OperationOptions {
    contentType?: "application/merge-patch+json";
}

declare interface PatchNullOptions_5 extends OperationOptions {
    contentType?: "application/merge-patch+json";
}

declare interface PatchNullOptions_6 extends OperationOptions {
    contentType?: "application/merge-patch+json";
}

declare interface PatchNullOptions_7 extends OperationOptions {
    contentType?: "application/merge-patch+json";
}

export declare function patchNullPayloadToTransport(payload: CollectionsStringProperty): any;

export declare function patchNullPayloadToTransport_2(payload: CollectionsModelProperty): any;

export declare function patchNullPayloadToTransport_3(payload: CollectionsByteProperty): any;

export declare function patchNullPayloadToTransport_4(payload: DurationProperty): any;

export declare function patchNullPayloadToTransport_5(payload: DatetimeProperty): any;

export declare function patchNullPayloadToTransport_6(payload: BytesProperty): any;

export declare function patchNullPayloadToTransport_7(payload: StringProperty): any;

declare type String_2 = string;
export { String_2 as String }

export declare class StringClient {
    #private;
    constructor(options?: StringClientOptions);
    getNonNull(options?: GetNonNullOptions): Promise<StringProperty>;
    getNull(options?: GetNullOptions): Promise<StringProperty>;
    patchNonNull(body: StringProperty, options?: PatchNonNullOptions): Promise<void>;
    patchNull(body: StringProperty, options?: PatchNullOptions): Promise<void>;
}

declare interface StringClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare interface StringProperty {
    "requiredProperty": string;
    "nullableProperty": string | null;
}

export declare type UtcDateTime = Date;

export { }
