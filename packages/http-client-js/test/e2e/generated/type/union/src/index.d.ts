import { ClientOptions } from '@typespec/ts-http-runtime';
import { PathUncheckedResponse } from '@typespec/ts-http-runtime';

declare type Boolean_2 = boolean;
export { Boolean_2 as Boolean }

export declare interface Cat {
    "name": string;
}

export declare function dateDeserializer(date?: string | null): Date;

export declare function dateRfc3339Serializer(date?: Date | null): string;

export declare function dateRfc7231Deserializer(date?: string | null): Date;

export declare function dateRfc7231Serializer(date?: Date | null): string;

export declare function dateUnixTimestampDeserializer(date?: number | null): Date;

export declare function dateUnixTimestampSerializer(date?: Date | null): number;

export declare function decodeBase64(value: string): Uint8Array | undefined;

export declare interface Dog {
    "bark": string;
}

export declare function encodeUint8Array(value: Uint8Array | undefined | null, encoding: BufferEncoding): string | undefined;

export declare interface EnumsOnlyCases {
    "lr": Lr | Ud;
    "ud": Ud | Ud;
}

export declare class EnumsOnlyClient {
    #private;
    constructor(options?: EnumsOnlyClientOptions);
    get(options?: GetOptions_7): Promise<{
        prop: EnumsOnlyCases;
    }>;
    send(prop: EnumsOnlyCases, options?: SendOptions_7): Promise<void>;
}

declare interface EnumsOnlyClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare class FloatsOnlyClient {
    #private;
    constructor(options?: FloatsOnlyClientOptions);
    get(options?: GetOptions_5): Promise<{
        prop: 1.1 | 2.2 | 3.3;
    }>;
    send(prop: 1.1 | 2.2 | 3.3, options?: SendOptions_5): Promise<void>;
}

declare interface FloatsOnlyClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare class GetAndSendClient {
    #private;
    constructor(options?: GetAndSendClientOptions);
}

declare interface GetAndSendClientOptions extends ClientOptions {
    endpoint?: string;
}

declare interface GetOptions extends OperationOptions {
}

declare interface GetOptions_10 extends OperationOptions {
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

export declare class IntsOnlyClient {
    #private;
    constructor(options?: IntsOnlyClientOptions);
    get(options?: GetOptions_4): Promise<{
        prop: 1 | 2 | 3;
    }>;
    send(prop: 1 | 2 | 3, options?: SendOptions_4): Promise<void>;
}

declare interface IntsOnlyClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare function jsonArrayElementToApplicationTransform(items_?: any): Array<Cat | "a" | number | boolean>;

export declare function jsonArrayElementToTransportTransform(items_?: Array<Cat | "a" | number | boolean> | null): any;

export declare function jsonArrayStringToApplicationTransform(items_?: any): Array<string>;

export declare function jsonArrayStringToTransportTransform(items_?: Array<string> | null): any;

export declare function jsonCatToApplicationTransform(input_?: any): Cat;

export declare function jsonCatToTransportTransform(input_?: Cat | null): any;

export declare function jsonDogToApplicationTransform(input_?: any): Dog;

export declare function jsonDogToTransportTransform(input_?: Dog | null): any;

export declare function jsonEnumsOnlyCasesToApplicationTransform(input_?: any): EnumsOnlyCases;

export declare function jsonEnumsOnlyCasesToTransportTransform(input_?: EnumsOnlyCases | null): any;

export declare function jsonMixedLiteralsCasesToApplicationTransform(input_?: any): MixedLiteralsCases;

export declare function jsonMixedLiteralsCasesToTransportTransform(input_?: MixedLiteralsCases | null): any;

export declare function jsonMixedTypesCasesToApplicationTransform(input_?: any): MixedTypesCases;

export declare function jsonMixedTypesCasesToTransportTransform(input_?: MixedTypesCases | null): any;

export declare function jsonStringAndArrayCasesToApplicationTransform(input_?: any): StringAndArrayCases;

export declare function jsonStringAndArrayCasesToTransportTransform(input_?: StringAndArrayCases | null): any;

export declare function jsonStringExtensibleNamedUnionToApplicationTransform(input_?: any): StringExtensibleNamedUnion;

export declare function jsonStringExtensibleNamedUnionToTransportTransform(input_?: StringExtensibleNamedUnion | null): any;

export declare enum Lr {
    Left = "left",
    Right = "right"
}

export declare interface MixedLiteralsCases {
    "stringLiteral": "a" | 2 | 3.3 | true;
    "intLiteral": "a" | 2 | 3.3 | true;
    "floatLiteral": "a" | 2 | 3.3 | true;
    "booleanLiteral": "a" | 2 | 3.3 | true;
}

export declare class MixedLiteralsClient {
    #private;
    constructor(options?: MixedLiteralsClientOptions);
    get(options?: GetOptions_9): Promise<{
        prop: MixedLiteralsCases;
    }>;
    send(prop: MixedLiteralsCases, options?: SendOptions_9): Promise<void>;
}

declare interface MixedLiteralsClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare interface MixedTypesCases {
    "model": Cat | "a" | number | boolean;
    "literal": Cat | "a" | number | boolean;
    "int": Cat | "a" | number | boolean;
    "boolean": Cat | "a" | number | boolean;
    "array": Array<Cat | "a" | number | boolean>;
}

export declare class MixedTypesClient {
    #private;
    constructor(options?: MixedTypesClientOptions);
    get(options?: GetOptions_10): Promise<{
        prop: MixedTypesCases;
    }>;
    send(prop: MixedTypesCases, options?: SendOptions_10): Promise<void>;
}

declare interface MixedTypesClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare class ModelsOnlyClient {
    #private;
    constructor(options?: ModelsOnlyClientOptions);
    get(options?: GetOptions_6): Promise<{
        prop: Cat | Dog;
    }>;
    send(prop: Cat | Dog, options?: SendOptions_6): Promise<void>;
}

declare interface ModelsOnlyClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare type Numeric = number;

declare interface OperationOptions {
    operationOptions?: {
        onResponse?: (rawResponse: PathUncheckedResponse) => void;
    };
}

declare interface SendOptions extends OperationOptions {
}

declare interface SendOptions_10 extends OperationOptions {
}

declare interface SendOptions_2 extends OperationOptions {
}

declare interface SendOptions_3 extends OperationOptions {
}

declare interface SendOptions_4 extends OperationOptions {
}

declare interface SendOptions_5 extends OperationOptions {
}

declare interface SendOptions_6 extends OperationOptions {
}

declare interface SendOptions_7 extends OperationOptions {
}

declare interface SendOptions_8 extends OperationOptions {
}

declare interface SendOptions_9 extends OperationOptions {
}

declare type String_2 = string;
export { String_2 as String }

export declare interface StringAndArrayCases {
    "string": string | Array<string>;
    "array": string | Array<string>;
}

export declare class StringAndArrayClient {
    #private;
    constructor(options?: StringAndArrayClientOptions);
    get(options?: GetOptions_8): Promise<{
        prop: StringAndArrayCases;
    }>;
    send(prop: StringAndArrayCases, options?: SendOptions_8): Promise<void>;
}

declare interface StringAndArrayClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare class StringExtensibleClient {
    #private;
    constructor(options?: StringExtensibleClientOptions);
    get(options?: GetOptions_2): Promise<{
        prop: string | "b" | "c";
    }>;
    send(prop: string | "b" | "c", options?: SendOptions_2): Promise<void>;
}

declare interface StringExtensibleClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare class StringExtensibleNamedClient {
    #private;
    constructor(options?: StringExtensibleNamedClientOptions);
    get(options?: GetOptions_3): Promise<{
        prop: StringExtensibleNamedUnion;
    }>;
    send(prop: StringExtensibleNamedUnion, options?: SendOptions_3): Promise<void>;
}

declare interface StringExtensibleNamedClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare type StringExtensibleNamedUnion = string | "b" | "c";

export declare class StringsOnlyClient {
    #private;
    constructor(options?: StringsOnlyClientOptions);
    get(options?: GetOptions): Promise<{
        prop: "a" | "b" | "c";
    }>;
    send(prop: "a" | "b" | "c", options?: SendOptions): Promise<void>;
}

declare interface StringsOnlyClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare enum Ud {
    Up = "up",
    Down = "down"
}

export declare class UnionClient {
    #private;
    getAndSendClient: GetAndSendClient;
    stringsOnlyClient: StringsOnlyClient;
    stringExtensibleClient: StringExtensibleClient;
    stringExtensibleNamedClient: StringExtensibleNamedClient;
    intsOnlyClient: IntsOnlyClient;
    floatsOnlyClient: FloatsOnlyClient;
    modelsOnlyClient: ModelsOnlyClient;
    enumsOnlyClient: EnumsOnlyClient;
    stringAndArrayClient: StringAndArrayClient;
    mixedLiteralsClient: MixedLiteralsClient;
    mixedTypesClient: MixedTypesClient;
    constructor(options?: UnionClientOptions);
}

declare interface UnionClientOptions extends ClientOptions {
    endpoint?: string;
}

export { }
