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

export declare function encodeUint8Array(value: Uint8Array | undefined | null, encoding: BufferEncoding): string | undefined;

declare interface GetOptions extends OperationOptions {
}

declare interface GetOptions_10 extends OperationOptions {
}

declare interface GetOptions_11 extends OperationOptions {
}

declare interface GetOptions_12 extends OperationOptions {
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

export declare type Int32 = number;

export declare type Int64 = bigint;

export declare type Integer = number;

export declare function jsonArrayInt32ToApplicationTransform(items_?: any): Array<number>;

export declare function jsonArrayInt32ToTransportTransform(items_?: Array<number> | null): any;

export declare function jsonArraySimpleModelToApplicationTransform(items_?: any): Array<SimpleModel>;

export declare function jsonArraySimpleModelToTransportTransform(items_?: Array<SimpleModel> | null): any;

export declare function jsonArrayStringToApplicationTransform(items_?: any): Array<string>;

export declare function jsonArrayStringToTransportTransform(items_?: Array<string> | null): any;

export declare function jsonModelWithArrayOfModelToApplicationTransform(input_?: any): ModelWithArrayOfModel;

export declare function jsonModelWithArrayOfModelToTransportTransform(input_?: ModelWithArrayOfModel | null): any;

export declare function jsonModelWithAttributesToApplicationTransform(input_?: any): ModelWithAttributes;

export declare function jsonModelWithAttributesToTransportTransform(input_?: ModelWithAttributes | null): any;

export declare function jsonModelWithDictionaryToApplicationTransform(input_?: any): ModelWithDictionary;

export declare function jsonModelWithDictionaryToTransportTransform(input_?: ModelWithDictionary | null): any;

export declare function jsonModelWithEmptyArrayToApplicationTransform(input_?: any): ModelWithEmptyArray;

export declare function jsonModelWithEmptyArrayToTransportTransform(input_?: ModelWithEmptyArray | null): any;

export declare function jsonModelWithEncodedNamesToApplicationTransform(input_?: any): ModelWithEncodedNames;

export declare function jsonModelWithEncodedNamesToTransportTransform(input_?: ModelWithEncodedNames | null): any;

export declare function jsonModelWithOptionalFieldToApplicationTransform(input_?: any): ModelWithOptionalField;

export declare function jsonModelWithOptionalFieldToTransportTransform(input_?: ModelWithOptionalField | null): any;

export declare function jsonModelWithRenamedArraysToApplicationTransform(input_?: any): ModelWithRenamedArrays;

export declare function jsonModelWithRenamedArraysToTransportTransform(input_?: ModelWithRenamedArrays | null): any;

export declare function jsonModelWithRenamedFieldsToApplicationTransform(input_?: any): ModelWithRenamedFields;

export declare function jsonModelWithRenamedFieldsToTransportTransform(input_?: ModelWithRenamedFields | null): any;

export declare function jsonModelWithSimpleArraysToApplicationTransform(input_?: any): ModelWithSimpleArrays;

export declare function jsonModelWithSimpleArraysToTransportTransform(input_?: ModelWithSimpleArrays | null): any;

export declare function jsonModelWithTextToApplicationTransform(input_?: any): ModelWithText;

export declare function jsonModelWithTextToTransportTransform(input_?: ModelWithText | null): any;

export declare function jsonModelWithUnwrappedArrayToApplicationTransform(input_?: any): ModelWithUnwrappedArray;

export declare function jsonModelWithUnwrappedArrayToTransportTransform(input_?: ModelWithUnwrappedArray | null): any;

export declare function jsonRecordStringToApplicationTransform(items_?: any): Record<string, any>;

export declare function jsonRecordStringToTransportTransform(items_?: Record<string, any> | null): any;

export declare function jsonSimpleModelToApplicationTransform(input_?: any): SimpleModel;

export declare function jsonSimpleModelToTransportTransform(input_?: SimpleModel | null): any;

export declare interface ModelWithArrayOfModel {
    "items": Array<SimpleModel>;
}

export declare class ModelWithArrayOfModelValueClient {
    #private;
    constructor(options?: ModelWithArrayOfModelValueClientOptions);
    get(options?: GetOptions_3): Promise<ModelWithArrayOfModel>;
    put(input: ModelWithArrayOfModel, options?: PutOptions_3): Promise<void>;
}

declare interface ModelWithArrayOfModelValueClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare interface ModelWithAttributes {
    "id1": number;
    "id2": string;
    "enabled": boolean;
}

export declare class ModelWithAttributesValueClient {
    #private;
    constructor(options?: ModelWithAttributesValueClientOptions);
    get(options?: GetOptions_5): Promise<ModelWithAttributes>;
    put(input: ModelWithAttributes, options?: PutOptions_5): Promise<void>;
}

declare interface ModelWithAttributesValueClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare interface ModelWithDictionary {
    "metadata": Record<string, string>;
}

export declare class ModelWithDictionaryValueClient {
    #private;
    constructor(options?: ModelWithDictionaryValueClientOptions);
    get(options?: GetOptions_11): Promise<ModelWithDictionary>;
    put(input: ModelWithDictionary, options?: PutOptions_11): Promise<void>;
}

declare interface ModelWithDictionaryValueClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare interface ModelWithEmptyArray {
    "items": Array<SimpleModel>;
}

export declare class ModelWithEmptyArrayValueClient {
    #private;
    constructor(options?: ModelWithEmptyArrayValueClientOptions);
    get(options?: GetOptions_9): Promise<ModelWithEmptyArray>;
    put(input: ModelWithEmptyArray, options?: PutOptions_9): Promise<void>;
}

declare interface ModelWithEmptyArrayValueClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare interface ModelWithEncodedNames {
    "modelData": SimpleModel;
    "colors": Array<string>;
}

export declare class ModelWithEncodedNamesValueClient {
    #private;
    constructor(options?: ModelWithEncodedNamesValueClientOptions);
    get(options?: GetOptions_12): Promise<ModelWithEncodedNames>;
    put(input: ModelWithEncodedNames, options?: PutOptions_12): Promise<void>;
}

declare interface ModelWithEncodedNamesValueClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare interface ModelWithOptionalField {
    "item": string;
    "value"?: number;
}

export declare class ModelWithOptionalFieldValueClient {
    #private;
    constructor(options?: ModelWithOptionalFieldValueClientOptions);
    get(options?: GetOptions_4): Promise<ModelWithOptionalField>;
    put(input: ModelWithOptionalField, options?: PutOptions_4): Promise<void>;
}

declare interface ModelWithOptionalFieldValueClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare interface ModelWithRenamedArrays {
    "colors": Array<string>;
    "counts": Array<number>;
}

export declare class ModelWithRenamedArraysValueClient {
    #private;
    constructor(options?: ModelWithRenamedArraysValueClientOptions);
    get(options?: GetOptions_7): Promise<ModelWithRenamedArrays>;
    put(input: ModelWithRenamedArrays, options?: PutOptions_7): Promise<void>;
}

declare interface ModelWithRenamedArraysValueClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare interface ModelWithRenamedFields {
    "inputData": SimpleModel;
    "outputData": SimpleModel;
}

export declare class ModelWithRenamedFieldsValueClient {
    #private;
    constructor(options?: ModelWithRenamedFieldsValueClientOptions);
    get(options?: GetOptions_8): Promise<ModelWithRenamedFields>;
    put(input: ModelWithRenamedFields, options?: PutOptions_8): Promise<void>;
}

declare interface ModelWithRenamedFieldsValueClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare interface ModelWithSimpleArrays {
    "colors": Array<string>;
    "counts": Array<number>;
}

export declare class ModelWithSimpleArraysValueClient {
    #private;
    constructor(options?: ModelWithSimpleArraysValueClientOptions);
    get(options?: GetOptions_2): Promise<ModelWithSimpleArrays>;
    put(input: ModelWithSimpleArrays, options?: PutOptions_2): Promise<void>;
}

declare interface ModelWithSimpleArraysValueClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare interface ModelWithText {
    "language": string;
    "content": string;
}

export declare class ModelWithTextValueClient {
    #private;
    constructor(options?: ModelWithTextValueClientOptions);
    get(options?: GetOptions_10): Promise<ModelWithText>;
    put(input: ModelWithText, options?: PutOptions_10): Promise<void>;
}

declare interface ModelWithTextValueClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare interface ModelWithUnwrappedArray {
    "colors": Array<string>;
    "counts": Array<number>;
}

export declare class ModelWithUnwrappedArrayValueClient {
    #private;
    constructor(options?: ModelWithUnwrappedArrayValueClientOptions);
    get(options?: GetOptions_6): Promise<ModelWithUnwrappedArray>;
    put(input: ModelWithUnwrappedArray, options?: PutOptions_6): Promise<void>;
}

declare interface ModelWithUnwrappedArrayValueClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare type Numeric = number;

declare interface OperationOptions {
    operationOptions?: {
        onResponse?: (rawResponse: PathUncheckedResponse) => void;
    };
}

declare interface PutOptions extends OperationOptions {
    contentType?: "application/xml";
}

declare interface PutOptions_10 extends OperationOptions {
    contentType?: "application/xml";
}

declare interface PutOptions_11 extends OperationOptions {
    contentType?: "application/xml";
}

declare interface PutOptions_12 extends OperationOptions {
    contentType?: "application/xml";
}

declare interface PutOptions_2 extends OperationOptions {
    contentType?: "application/xml";
}

declare interface PutOptions_3 extends OperationOptions {
    contentType?: "application/xml";
}

declare interface PutOptions_4 extends OperationOptions {
    contentType?: "application/xml";
}

declare interface PutOptions_5 extends OperationOptions {
    contentType?: "application/xml";
}

declare interface PutOptions_6 extends OperationOptions {
    contentType?: "application/xml";
}

declare interface PutOptions_7 extends OperationOptions {
    contentType?: "application/xml";
}

declare interface PutOptions_8 extends OperationOptions {
    contentType?: "application/xml";
}

declare interface PutOptions_9 extends OperationOptions {
    contentType?: "application/xml";
}

export declare function putPayloadToTransport(payload: ModelWithEncodedNames): any;

export declare function putPayloadToTransport_10(payload: ModelWithArrayOfModel): any;

export declare function putPayloadToTransport_11(payload: ModelWithSimpleArrays): any;

export declare function putPayloadToTransport_12(payload: SimpleModel): any;

export declare function putPayloadToTransport_2(payload: ModelWithDictionary): any;

export declare function putPayloadToTransport_3(payload: ModelWithText): any;

export declare function putPayloadToTransport_4(payload: ModelWithEmptyArray): any;

export declare function putPayloadToTransport_5(payload: ModelWithRenamedFields): any;

export declare function putPayloadToTransport_6(payload: ModelWithRenamedArrays): any;

export declare function putPayloadToTransport_7(payload: ModelWithUnwrappedArray): any;

export declare function putPayloadToTransport_8(payload: ModelWithAttributes): any;

export declare function putPayloadToTransport_9(payload: ModelWithOptionalField): any;

export declare interface SimpleModel {
    "name": string;
    "age": number;
}

export declare class SimpleModelValueClient {
    #private;
    constructor(options?: SimpleModelValueClientOptions);
    get(options?: GetOptions): Promise<SimpleModel>;
    put(input: SimpleModel, options?: PutOptions): Promise<void>;
}

declare interface SimpleModelValueClientOptions extends ClientOptions {
    endpoint?: string;
}

declare type String_2 = string;
export { String_2 as String }

export declare class XmlClient {
    #private;
    xmlOperationsClient: XmlOperationsClient;
    simpleModelValueClient: SimpleModelValueClient;
    modelWithSimpleArraysValueClient: ModelWithSimpleArraysValueClient;
    modelWithArrayOfModelValueClient: ModelWithArrayOfModelValueClient;
    modelWithOptionalFieldValueClient: ModelWithOptionalFieldValueClient;
    modelWithAttributesValueClient: ModelWithAttributesValueClient;
    modelWithUnwrappedArrayValueClient: ModelWithUnwrappedArrayValueClient;
    modelWithRenamedArraysValueClient: ModelWithRenamedArraysValueClient;
    modelWithRenamedFieldsValueClient: ModelWithRenamedFieldsValueClient;
    modelWithEmptyArrayValueClient: ModelWithEmptyArrayValueClient;
    modelWithTextValueClient: ModelWithTextValueClient;
    modelWithDictionaryValueClient: ModelWithDictionaryValueClient;
    modelWithEncodedNamesValueClient: ModelWithEncodedNamesValueClient;
    constructor(options?: XmlClientOptions);
}

declare interface XmlClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare class XmlOperationsClient {
    #private;
    constructor(options?: XmlOperationsClientOptions);
}

declare interface XmlOperationsClientOptions extends ClientOptions {
    endpoint?: string;
}

export { }
