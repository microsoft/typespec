import { ClientOptions } from '@typespec/ts-http-runtime';
import { PathUncheckedResponse } from '@typespec/ts-http-runtime';

declare type Boolean_2 = boolean;
export { Boolean_2 as Boolean }

export declare class BooleanClient {
    #private;
    constructor(options?: BooleanClientOptions);
    get(options?: GetOptions_2): Promise<boolean>;
    put(body: boolean, options?: PutOptions_2): Promise<void>;
}

declare interface BooleanClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare function dateDeserializer(date?: string | null): Date;

export declare function dateRfc3339Serializer(date?: Date | null): string;

export declare function dateRfc7231Deserializer(date?: string | null): Date;

export declare function dateRfc7231Serializer(date?: Date | null): string;

export declare function dateUnixTimestampDeserializer(date?: number | null): Date;

export declare function dateUnixTimestampSerializer(date?: Date | null): number;

export declare type Decimal = number;

export declare type Decimal128 = number;

export declare class Decimal128TypeClient {
    #private;
    constructor(options?: Decimal128TypeClientOptions);
    responseBody(options?: ResponseBodyOptions_2): Promise<number>;
    requestBody(body: number, options?: RequestBodyOptions_2): Promise<void>;
    requestParameter(value: number, options?: RequestParameterOptions_2): Promise<void>;
}

declare interface Decimal128TypeClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare class Decimal128VerifyClient {
    #private;
    constructor(options?: Decimal128VerifyClientOptions);
    prepareVerify(options?: PrepareVerifyOptions_2): Promise<number[]>;
    verify(body: number, options?: VerifyOptions_2): Promise<void>;
}

declare interface Decimal128VerifyClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare class DecimalTypeClient {
    #private;
    constructor(options?: DecimalTypeClientOptions);
    responseBody(options?: ResponseBodyOptions): Promise<number>;
    requestBody(body: number, options?: RequestBodyOptions): Promise<void>;
    requestParameter(value: number, options?: RequestParameterOptions): Promise<void>;
}

declare interface DecimalTypeClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare class DecimalVerifyClient {
    #private;
    constructor(options?: DecimalVerifyClientOptions);
    prepareVerify(options?: PrepareVerifyOptions): Promise<number[]>;
    verify(body: number, options?: VerifyOptions): Promise<void>;
}

declare interface DecimalVerifyClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare function decodeBase64(value: string): Uint8Array | undefined;

export declare function encodeUint8Array(value: Uint8Array | undefined | null, encoding: BufferEncoding): string | undefined;

declare interface GetOptions extends OperationOptions {
}

declare interface GetOptions_2 extends OperationOptions {
}

declare interface GetOptions_3 extends OperationOptions {
}

export declare function jsonArrayDecimalToApplicationTransform(items_?: any): Array<number>;

export declare function jsonArrayDecimalToTransportTransform(items_?: Array<number> | null): any;

export declare class NumberTypesVerifyOperationsClient {
    #private;
    constructor(options?: NumberTypesVerifyOperationsClientOptions);
}

declare interface NumberTypesVerifyOperationsClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare type Numeric = number;

declare interface OperationOptions {
    operationOptions?: {
        onResponse?: (rawResponse: PathUncheckedResponse) => void;
    };
}

declare interface PrepareVerifyOptions extends OperationOptions {
}

declare interface PrepareVerifyOptions_2 extends OperationOptions {
}

declare interface PutOptions extends OperationOptions {
}

declare interface PutOptions_2 extends OperationOptions {
}

declare interface PutOptions_3 extends OperationOptions {
}

export declare function putPayloadToTransport(payload: unknown): unknown;

export declare function putPayloadToTransport_2(payload: boolean): boolean;

export declare function putPayloadToTransport_3(payload: string): string;

declare interface RequestBodyOptions extends OperationOptions {
}

declare interface RequestBodyOptions_2 extends OperationOptions {
}

export declare function requestBodyPayloadToTransport(payload: number): number;

export declare function requestBodyPayloadToTransport_2(payload: number): number;

declare interface RequestParameterOptions extends OperationOptions {
}

declare interface RequestParameterOptions_2 extends OperationOptions {
}

declare interface ResponseBodyOptions extends OperationOptions {
}

declare interface ResponseBodyOptions_2 extends OperationOptions {
}

export declare class ScalarClient {
    #private;
    stringClient: StringClient;
    booleanClient: BooleanClient;
    unknownClient: UnknownClient;
    scalarTypesOperationsClient: ScalarTypesOperationsClient;
    decimalTypeClient: DecimalTypeClient;
    decimal128TypeClient: Decimal128TypeClient;
    numberTypesVerifyOperationsClient: NumberTypesVerifyOperationsClient;
    decimalVerifyClient: DecimalVerifyClient;
    decimal128VerifyClient: Decimal128VerifyClient;
    constructor(options?: ScalarClientOptions);
}

declare interface ScalarClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare class ScalarTypesOperationsClient {
    #private;
    constructor(options?: ScalarTypesOperationsClientOptions);
}

declare interface ScalarTypesOperationsClientOptions extends ClientOptions {
    endpoint?: string;
}

declare type String_2 = string;
export { String_2 as String }

export declare class StringClient {
    #private;
    constructor(options?: StringClientOptions);
    get(options?: GetOptions): Promise<string>;
    put(body: string, options?: PutOptions): Promise<void>;
}

declare interface StringClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare class UnknownClient {
    #private;
    constructor(options?: UnknownClientOptions);
    get(options?: GetOptions_3): Promise<unknown>;
    put(body: unknown, options?: PutOptions_3): Promise<void>;
}

declare interface UnknownClientOptions extends ClientOptions {
    endpoint?: string;
}

declare interface VerifyOptions extends OperationOptions {
}

declare interface VerifyOptions_2 extends OperationOptions {
}

export declare function verifyPayloadToTransport(payload: number): number;

export declare function verifyPayloadToTransport_2(payload: number): number;

export { }
