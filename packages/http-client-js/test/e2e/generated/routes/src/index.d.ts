import { ClientOptions } from '@typespec/ts-http-runtime';
import { PathUncheckedResponse } from '@typespec/ts-http-runtime';

declare interface AnnotationOnlyOptions extends OperationOptions {
}

declare interface AnnotationOnlyOptions_2 extends OperationOptions {
}

declare interface AnnotationOptions extends OperationOptions {
}

declare interface ArrayOptions extends OperationOptions {
}

declare interface ArrayOptions_10 extends OperationOptions {
}

declare interface ArrayOptions_11 extends OperationOptions {
}

declare interface ArrayOptions_12 extends OperationOptions {
}

declare interface ArrayOptions_2 extends OperationOptions {
}

declare interface ArrayOptions_3 extends OperationOptions {
}

declare interface ArrayOptions_4 extends OperationOptions {
}

declare interface ArrayOptions_5 extends OperationOptions {
}

declare interface ArrayOptions_6 extends OperationOptions {
}

declare interface ArrayOptions_7 extends OperationOptions {
}

declare interface ArrayOptions_8 extends OperationOptions {
}

declare interface ArrayOptions_9 extends OperationOptions {
}

export declare function dateDeserializer(date?: string | null): Date;

export declare function dateRfc3339Serializer(date?: Date | null): string;

export declare function dateRfc7231Deserializer(date?: string | null): Date;

export declare function dateRfc7231Serializer(date?: Date | null): string;

export declare function dateUnixTimestampDeserializer(date?: number | null): Date;

export declare function dateUnixTimestampSerializer(date?: Date | null): number;

export declare function decodeBase64(value: string): Uint8Array | undefined;

export declare function encodeUint8Array(value: Uint8Array | undefined | null, encoding: BufferEncoding): string | undefined;

declare interface ExplicitOptions extends OperationOptions {
}

declare interface ExplicitOptions_2 extends OperationOptions {
}

export declare class ExplodeClient {
    #private;
    constructor(options?: ExplodeClientOptions_6);
    primitive(param: string, options?: PrimitiveOptions_12): Promise<void>;
    array(param: Array<string>, options?: ArrayOptions_12): Promise<void>;
    record(param: Record<string, number>, options?: RecordOptions_12): Promise<void>;
}

export declare class ExplodeClient_2 {
    #private;
    constructor(options?: ExplodeClientOptions_5);
    primitive(param: string, options?: PrimitiveOptions_10): Promise<void>;
    array(param: Array<string>, options?: ArrayOptions_10): Promise<void>;
    record(param: Record<string, number>, options?: RecordOptions_10): Promise<void>;
}

export declare class ExplodeClient_3 {
    #private;
    constructor(options?: ExplodeClientOptions_4);
    primitive(param: string, options?: PrimitiveOptions_8): Promise<void>;
    array(param: Array<string>, options?: ArrayOptions_8): Promise<void>;
    record(param: Record<string, number>, options?: RecordOptions_8): Promise<void>;
}

export declare class ExplodeClient_4 {
    #private;
    constructor(options?: ExplodeClientOptions_3);
    primitive(param: string, options?: PrimitiveOptions_6): Promise<void>;
    array(param: Array<string>, options?: ArrayOptions_6): Promise<void>;
    record(param: Record<string, number>, options?: RecordOptions_6): Promise<void>;
}

export declare class ExplodeClient_5 {
    #private;
    constructor(options?: ExplodeClientOptions_2);
    primitive(param: string, options?: PrimitiveOptions_4): Promise<void>;
    array(param: Array<string>, options?: ArrayOptions_4): Promise<void>;
    record(param: Record<string, number>, options?: RecordOptions_4): Promise<void>;
}

export declare class ExplodeClient_6 {
    #private;
    constructor(options?: ExplodeClientOptions);
    primitive(param: string, options?: PrimitiveOptions_2): Promise<void>;
    array(param: Array<string>, options?: ArrayOptions_2): Promise<void>;
    record(param: Record<string, number>, options?: RecordOptions_2): Promise<void>;
}

declare interface ExplodeClientOptions extends ClientOptions {
    endpoint?: string;
}

declare interface ExplodeClientOptions_2 extends ClientOptions {
    endpoint?: string;
}

declare interface ExplodeClientOptions_3 extends ClientOptions {
    endpoint?: string;
}

declare interface ExplodeClientOptions_4 extends ClientOptions {
    endpoint?: string;
}

declare interface ExplodeClientOptions_5 extends ClientOptions {
    endpoint?: string;
}

declare interface ExplodeClientOptions_6 extends ClientOptions {
    endpoint?: string;
}

declare interface FixedOptions extends OperationOptions {
}

declare interface FixedOptions_2 extends OperationOptions {
}

export declare class InInterfaceClient {
    #private;
    constructor(options?: InInterfaceClientOptions);
    fixed(options?: FixedOptions): Promise<void>;
}

declare interface InInterfaceClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare type Int32 = number;

export declare type Int64 = bigint;

export declare type Integer = number;

export declare function jsonArrayStringToApplicationTransform(items_?: any): Array<string>;

export declare function jsonArrayStringToTransportTransform(items_?: Array<string> | null): any;

export declare function jsonRecordInt32ToApplicationTransform(items_?: any): Record<string, any>;

export declare function jsonRecordInt32ToTransportTransform(items_?: Record<string, any> | null): any;

export declare class LabelExpansionClient {
    #private;
    standardClient: StandardClient_4;
    explodeClient: ExplodeClient_4;
    constructor(options?: LabelExpansionClientOptions);
}

declare interface LabelExpansionClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare class MatrixExpansionClient {
    #private;
    standardClient: StandardClient_3;
    explodeClient: ExplodeClient_3;
    constructor(options?: MatrixExpansionClientOptions);
}

declare interface MatrixExpansionClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare type Numeric = number;

declare interface OperationOptions {
    operationOptions?: {
        onResponse?: (rawResponse: PathUncheckedResponse) => void;
    };
}

export declare class PathExpansionClient {
    #private;
    standardClient: StandardClient_5;
    explodeClient: ExplodeClient_5;
    constructor(options?: PathExpansionClientOptions);
}

declare interface PathExpansionClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare class PathParametersClient {
    #private;
    reservedExpansionClient: ReservedExpansionClient;
    simpleExpansionClient: SimpleExpansionClient;
    pathExpansionClient: PathExpansionClient;
    labelExpansionClient: LabelExpansionClient;
    matrixExpansionClient: MatrixExpansionClient;
    constructor(options?: PathParametersClientOptions);
    templateOnly(param: string, options?: TemplateOnlyOptions): Promise<void>;
    explicit(param: string, options?: ExplicitOptions): Promise<void>;
    annotationOnly(param: string, options?: AnnotationOnlyOptions): Promise<void>;
}

declare interface PathParametersClientOptions extends ClientOptions {
    endpoint?: string;
}

declare interface PrimitiveOptions extends OperationOptions {
}

declare interface PrimitiveOptions_10 extends OperationOptions {
}

declare interface PrimitiveOptions_11 extends OperationOptions {
}

declare interface PrimitiveOptions_12 extends OperationOptions {
}

declare interface PrimitiveOptions_2 extends OperationOptions {
}

declare interface PrimitiveOptions_3 extends OperationOptions {
}

declare interface PrimitiveOptions_4 extends OperationOptions {
}

declare interface PrimitiveOptions_5 extends OperationOptions {
}

declare interface PrimitiveOptions_6 extends OperationOptions {
}

declare interface PrimitiveOptions_7 extends OperationOptions {
}

declare interface PrimitiveOptions_8 extends OperationOptions {
}

declare interface PrimitiveOptions_9 extends OperationOptions {
}

export declare class QueryContinuationClient {
    #private;
    standardClient: StandardClient;
    explodeClient: ExplodeClient;
    constructor(options?: QueryContinuationClientOptions);
}

declare interface QueryContinuationClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare class QueryExpansionClient {
    #private;
    standardClient: StandardClient_2;
    explodeClient: ExplodeClient_2;
    constructor(options?: QueryExpansionClientOptions);
}

declare interface QueryExpansionClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare class QueryParametersClient {
    #private;
    queryExpansionClient: QueryExpansionClient;
    queryContinuationClient: QueryContinuationClient;
    constructor(options?: QueryParametersClientOptions);
    templateOnly(param: string, options?: TemplateOnlyOptions_2): Promise<void>;
    explicit(param: string, options?: ExplicitOptions_2): Promise<void>;
    annotationOnly(param: string, options?: AnnotationOnlyOptions_2): Promise<void>;
}

declare interface QueryParametersClientOptions extends ClientOptions {
    endpoint?: string;
}

declare interface RecordOptions extends OperationOptions {
}

declare interface RecordOptions_10 extends OperationOptions {
}

declare interface RecordOptions_11 extends OperationOptions {
}

declare interface RecordOptions_12 extends OperationOptions {
}

declare interface RecordOptions_2 extends OperationOptions {
}

declare interface RecordOptions_3 extends OperationOptions {
}

declare interface RecordOptions_4 extends OperationOptions {
}

declare interface RecordOptions_5 extends OperationOptions {
}

declare interface RecordOptions_6 extends OperationOptions {
}

declare interface RecordOptions_7 extends OperationOptions {
}

declare interface RecordOptions_8 extends OperationOptions {
}

declare interface RecordOptions_9 extends OperationOptions {
}

export declare class ReservedExpansionClient {
    #private;
    constructor(options?: ReservedExpansionClientOptions);
    template(param: string, options?: TemplateOptions): Promise<void>;
    annotation(param: string, options?: AnnotationOptions): Promise<void>;
}

declare interface ReservedExpansionClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare class RoutesClient {
    #private;
    pathParametersClient: PathParametersClient;
    queryParametersClient: QueryParametersClient;
    inInterfaceClient: InInterfaceClient;
    constructor(options?: RoutesClientOptions);
    fixed(options?: FixedOptions_2): Promise<void>;
}

declare interface RoutesClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare class SimpleExpansionClient {
    #private;
    standardClient: StandardClient_6;
    explodeClient: ExplodeClient_6;
    constructor(options?: SimpleExpansionClientOptions);
}

declare interface SimpleExpansionClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare class StandardClient {
    #private;
    constructor(options?: StandardClientOptions_6);
    primitive(param: string, options?: PrimitiveOptions_11): Promise<void>;
    array(param: Array<string>, options?: ArrayOptions_11): Promise<void>;
    record(param: Record<string, number>, options?: RecordOptions_11): Promise<void>;
}

export declare class StandardClient_2 {
    #private;
    constructor(options?: StandardClientOptions_5);
    primitive(param: string, options?: PrimitiveOptions_9): Promise<void>;
    array(param: Array<string>, options?: ArrayOptions_9): Promise<void>;
    record(param: Record<string, number>, options?: RecordOptions_9): Promise<void>;
}

export declare class StandardClient_3 {
    #private;
    constructor(options?: StandardClientOptions_4);
    primitive(param: string, options?: PrimitiveOptions_7): Promise<void>;
    array(param: Array<string>, options?: ArrayOptions_7): Promise<void>;
    record(param: Record<string, number>, options?: RecordOptions_7): Promise<void>;
}

export declare class StandardClient_4 {
    #private;
    constructor(options?: StandardClientOptions_3);
    primitive(param: string, options?: PrimitiveOptions_5): Promise<void>;
    array(param: Array<string>, options?: ArrayOptions_5): Promise<void>;
    record(param: Record<string, number>, options?: RecordOptions_5): Promise<void>;
}

export declare class StandardClient_5 {
    #private;
    constructor(options?: StandardClientOptions_2);
    primitive(param: string, options?: PrimitiveOptions_3): Promise<void>;
    array(param: Array<string>, options?: ArrayOptions_3): Promise<void>;
    record(param: Record<string, number>, options?: RecordOptions_3): Promise<void>;
}

export declare class StandardClient_6 {
    #private;
    constructor(options?: StandardClientOptions);
    primitive(param: string, options?: PrimitiveOptions): Promise<void>;
    array(param: Array<string>, options?: ArrayOptions): Promise<void>;
    record(param: Record<string, number>, options?: RecordOptions): Promise<void>;
}

declare interface StandardClientOptions extends ClientOptions {
    endpoint?: string;
}

declare interface StandardClientOptions_2 extends ClientOptions {
    endpoint?: string;
}

declare interface StandardClientOptions_3 extends ClientOptions {
    endpoint?: string;
}

declare interface StandardClientOptions_4 extends ClientOptions {
    endpoint?: string;
}

declare interface StandardClientOptions_5 extends ClientOptions {
    endpoint?: string;
}

declare interface StandardClientOptions_6 extends ClientOptions {
    endpoint?: string;
}

declare type String_2 = string;
export { String_2 as String }

declare interface TemplateOnlyOptions extends OperationOptions {
}

declare interface TemplateOnlyOptions_2 extends OperationOptions {
}

declare interface TemplateOptions extends OperationOptions {
}

export { }
