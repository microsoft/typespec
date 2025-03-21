import { ClientOptions } from '@typespec/ts-http-runtime';
import { PathUncheckedResponse } from '@typespec/ts-http-runtime';

export declare interface Address {
    "city": string;
}

declare interface AnonymousModelOptions extends OperationOptions {
    contentType?: "multipart/form-data";
}

declare interface BasicOptions extends OperationOptions {
    contentType?: "multipart/form-data";
}

export declare function basicPayloadToTransport(payload: MultiPartRequest): any;

declare interface BinaryArrayPartsOptions extends OperationOptions {
    contentType?: "multipart/form-data";
}

export declare function binaryArrayPartsPayloadToTransport(payload: BinaryArrayPartsRequest): any;

export declare interface BinaryArrayPartsRequest {
    "id": string;
    "pictures": Array<Uint8Array>;
}

export declare type Bytes = Uint8Array;

declare interface CheckFileNameAndContentTypeOptions extends OperationOptions {
    contentType?: "multipart/form-data";
}

export declare function checkFileNameAndContentTypePayloadToTransport(payload: MultiPartRequest): any;

export declare interface ComplexHttpPartsModelRequest {
    "id": string;
    "address": Address;
    "profileImage": FileRequiredMetaData;
    "previousAddresses": Array<Address>;
    "pictures": Array<FileRequiredMetaData>;
}

export declare interface ComplexPartsRequest {
    "id": string;
    "address": Address;
    "profileImage": Uint8Array;
    "pictures": Array<Uint8Array>;
}

export declare class ContentTypeClient {
    #private;
    constructor(options?: ContentTypeClientOptions);
    imageJpegContentType(body: FileWithHttpPartSpecificContentTypeRequest, options?: ImageJpegContentTypeOptions): Promise<void>;
    requiredContentType(body: FileWithHttpPartRequiredContentTypeRequest, options?: RequiredContentTypeOptions): Promise<void>;
    optionalContentType(body: FileWithHttpPartOptionalContentTypeRequest, options?: OptionalContentTypeOptions): Promise<void>;
}

declare interface ContentTypeClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare function dateDeserializer(date?: string | null): Date;

export declare function dateRfc3339Serializer(date?: Date | null): string;

export declare function dateRfc7231Deserializer(date?: string | null): Date;

export declare function dateRfc7231Serializer(date?: Date | null): string;

export declare function dateUnixTimestampDeserializer(date?: number | null): Date;

export declare function dateUnixTimestampSerializer(date?: Date | null): number;

export declare function decodeBase64(value: string): Uint8Array | undefined;

export declare function encodeUint8Array(value: Uint8Array | undefined | null, encoding: BufferEncoding): string | undefined;

declare type File_2 = File_3;
export { File_2 as File }

declare interface File_3 {
    contents: FileContents;
    contentType?: string;
    filename?: string;
}

declare interface FileArrayAndBasicOptions extends OperationOptions {
    contentType?: "multipart/form-data";
}

export declare function fileArrayAndBasicPayloadToTransport(payload: ComplexPartsRequest): any;

declare type FileContents = string | NodeJS.ReadableStream | ReadableStream<Uint8Array> | Uint8Array | Blob;

export declare interface FileOptionalContentType extends File_2 {
    "filename": string;
}

export declare interface FileRequiredMetaData extends File_2 {
    "filename": string;
    "contentType": string;
}

export declare interface FileSpecificContentType extends File_2 {
    "filename": string;
    "contentType": "image/jpg";
}

export declare interface FileWithHttpPartOptionalContentTypeRequest {
    "profileImage": FileOptionalContentType;
}

export declare interface FileWithHttpPartRequiredContentTypeRequest {
    "profileImage": FileRequiredMetaData;
}

export declare interface FileWithHttpPartSpecificContentTypeRequest {
    "profileImage": FileSpecificContentType;
}

export declare type Float = number;

export declare type Float64 = number;

declare interface FloatOptions extends OperationOptions {
    contentType?: "multipart/form-data";
}

export declare class FormDataClient {
    #private;
    httpPartsClient: HttpPartsClient;
    constructor(options?: FormDataClientOptions);
    basic(body: MultiPartRequest, options?: BasicOptions): Promise<void>;
    fileArrayAndBasic(body: ComplexPartsRequest, options?: FileArrayAndBasicOptions): Promise<void>;
    jsonPart(body: JsonPartRequest, options?: JsonPartOptions): Promise<void>;
    binaryArrayParts(body: BinaryArrayPartsRequest, options?: BinaryArrayPartsOptions): Promise<void>;
    multiBinaryParts(body: MultiBinaryPartsRequest, options?: MultiBinaryPartsOptions): Promise<void>;
    checkFileNameAndContentType(body: MultiPartRequest, options?: CheckFileNameAndContentTypeOptions): Promise<void>;
    anonymousModel(profileImage: Uint8Array, options?: AnonymousModelOptions): Promise<void>;
}

declare interface FormDataClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare class HttpPartsClient {
    #private;
    contentTypeClient: ContentTypeClient;
    nonStringClient: NonStringClient;
    constructor(options?: HttpPartsClientOptions);
    jsonArrayAndFileArray(body: ComplexHttpPartsModelRequest, options?: JsonArrayAndFileArrayOptions): Promise<void>;
}

declare interface HttpPartsClientOptions extends ClientOptions {
    endpoint?: string;
}

declare interface ImageJpegContentTypeOptions extends OperationOptions {
    contentType?: "multipart/form-data";
}

export declare function jsonAddressToApplicationTransform(input_?: any): Address;

export declare function jsonAddressToTransportTransform(input_?: Address | null): any;

export declare function jsonArrayAddressToApplicationTransform(items_?: any): Array<Address>;

export declare function jsonArrayAddressToTransportTransform(items_?: Array<Address> | null): any;

declare interface JsonArrayAndFileArrayOptions extends OperationOptions {
    contentType?: "multipart/form-data";
}

export declare function jsonArrayBytesToApplicationTransform(items_?: any): Array<Uint8Array>;

export declare function jsonArrayBytesToTransportTransform(items_?: Array<Uint8Array> | null): any;

export declare function jsonArrayHttpPartToApplicationTransform(items_?: any): Array<FileRequiredMetaData>;

export declare function jsonArrayHttpPartToTransportTransform(items_?: Array<FileRequiredMetaData> | null): any;

export declare function jsonBinaryArrayPartsRequestToApplicationTransform(input_?: any): BinaryArrayPartsRequest;

export declare function jsonBinaryArrayPartsRequestToTransportTransform(input_?: BinaryArrayPartsRequest | null): any;

export declare function jsonComplexHttpPartsModelRequestToApplicationTransform(input_?: any): ComplexHttpPartsModelRequest;

export declare function jsonComplexHttpPartsModelRequestToTransportTransform(input_?: ComplexHttpPartsModelRequest | null): any;

export declare function jsonComplexPartsRequestToApplicationTransform(input_?: any): ComplexPartsRequest;

export declare function jsonComplexPartsRequestToTransportTransform(input_?: ComplexPartsRequest | null): any;

export declare function jsonFileOptionalContentTypeToApplicationTransform(input_?: any): FileOptionalContentType;

export declare function jsonFileOptionalContentTypeToTransportTransform(input_?: FileOptionalContentType | null): any;

export declare function jsonFileRequiredMetaDataToApplicationTransform(input_?: any): FileRequiredMetaData;

export declare function jsonFileRequiredMetaDataToTransportTransform(input_?: FileRequiredMetaData | null): any;

export declare function jsonFileSpecificContentTypeToApplicationTransform(input_?: any): FileSpecificContentType;

export declare function jsonFileSpecificContentTypeToTransportTransform(input_?: FileSpecificContentType | null): any;

export declare function jsonFileToApplicationTransform(input_?: any): File_2;

export declare function jsonFileToTransportTransform(input_?: File_2 | null): any;

export declare function jsonFileWithHttpPartOptionalContentTypeRequestToApplicationTransform(input_?: any): FileWithHttpPartOptionalContentTypeRequest;

export declare function jsonFileWithHttpPartOptionalContentTypeRequestToTransportTransform(input_?: FileWithHttpPartOptionalContentTypeRequest | null): any;

export declare function jsonFileWithHttpPartRequiredContentTypeRequestToApplicationTransform(input_?: any): FileWithHttpPartRequiredContentTypeRequest;

export declare function jsonFileWithHttpPartRequiredContentTypeRequestToTransportTransform(input_?: FileWithHttpPartRequiredContentTypeRequest | null): any;

export declare function jsonFileWithHttpPartSpecificContentTypeRequestToApplicationTransform(input_?: any): FileWithHttpPartSpecificContentTypeRequest;

export declare function jsonFileWithHttpPartSpecificContentTypeRequestToTransportTransform(input_?: FileWithHttpPartSpecificContentTypeRequest | null): any;

export declare function jsonJsonPartRequestToApplicationTransform(input_?: any): JsonPartRequest;

export declare function jsonJsonPartRequestToTransportTransform(input_?: JsonPartRequest | null): any;

export declare function jsonMultiBinaryPartsRequestToApplicationTransform(input_?: any): MultiBinaryPartsRequest;

export declare function jsonMultiBinaryPartsRequestToTransportTransform(input_?: MultiBinaryPartsRequest | null): any;

export declare function jsonMultiPartRequestToApplicationTransform(input_?: any): MultiPartRequest;

export declare function jsonMultiPartRequestToTransportTransform(input_?: MultiPartRequest | null): any;

declare interface JsonPartOptions extends OperationOptions {
    contentType?: "multipart/form-data";
}

export declare function jsonPartPayloadToTransport(payload: JsonPartRequest): any;

export declare interface JsonPartRequest {
    "address": Address;
    "profileImage": Uint8Array;
}

declare interface MultiBinaryPartsOptions extends OperationOptions {
    contentType?: "multipart/form-data";
}

export declare function multiBinaryPartsPayloadToTransport(payload: MultiBinaryPartsRequest): any;

export declare interface MultiBinaryPartsRequest {
    "profileImage": Uint8Array;
    "picture"?: Uint8Array;
}

export declare interface MultiPartRequest {
    "id": string;
    "profileImage": Uint8Array;
}

export declare class NonStringClient {
    #private;
    constructor(options?: NonStringClientOptions);
    float(body: {
        "temperature": {
            "body": number;
            "contentType": "text/plain";
        };
    }, options?: FloatOptions): Promise<void>;
}

declare interface NonStringClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare type Numeric = number;

declare interface OperationOptions {
    operationOptions?: {
        onResponse?: (rawResponse: PathUncheckedResponse) => void;
    };
}

declare interface OptionalContentTypeOptions extends OperationOptions {
    contentType?: "multipart/form-data";
}

declare interface RequiredContentTypeOptions extends OperationOptions {
    contentType?: "multipart/form-data";
}

declare type String_2 = string;
export { String_2 as String }

export { }
