import { ClientOptions } from '@typespec/ts-http-runtime';
import { PathUncheckedResponse } from '@typespec/ts-http-runtime';

export declare class CollectionFormatClient {
    #private;
    queryClient: QueryClient;
    headerClient: HeaderClient;
    constructor(options?: CollectionFormatClientOptions);
}

declare interface CollectionFormatClientOptions extends ClientOptions {
    endpoint?: string;
}

declare interface CsvOptions extends OperationOptions {
}

declare interface CsvOptions_2 extends OperationOptions {
}

export declare function dateDeserializer(date?: string | null): Date;

export declare function dateRfc3339Serializer(date?: Date | null): string;

export declare function dateRfc7231Deserializer(date?: string | null): Date;

export declare function dateRfc7231Serializer(date?: Date | null): string;

export declare function dateUnixTimestampDeserializer(date?: number | null): Date;

export declare function dateUnixTimestampSerializer(date?: Date | null): number;

export declare function decodeBase64(value: string): Uint8Array | undefined;

export declare function encodeUint8Array(value: Uint8Array | undefined | null, encoding: BufferEncoding): string | undefined;

export declare class HeaderClient {
    #private;
    constructor(options?: HeaderClientOptions);
    csv(colors: Array<string>, options?: CsvOptions_2): Promise<void>;
}

declare interface HeaderClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare function jsonArrayStringToApplicationTransform(items_?: any): Array<string>;

export declare function jsonArrayStringToTransportTransform(items_?: Array<string> | null): any;

declare interface MultiOptions extends OperationOptions {
}

declare interface OperationOptions {
    operationOptions?: {
        onResponse?: (rawResponse: PathUncheckedResponse) => void;
    };
}

declare interface PipesOptions extends OperationOptions {
}

export declare class QueryClient {
    #private;
    constructor(options?: QueryClientOptions);
    multi(colors: Array<string>, options?: MultiOptions): Promise<void>;
    ssv(colors: Array<string>, options?: SsvOptions): Promise<void>;
    pipes(colors: Array<string>, options?: PipesOptions): Promise<void>;
    csv(colors: Array<string>, options?: CsvOptions): Promise<void>;
}

declare interface QueryClientOptions extends ClientOptions {
    endpoint?: string;
}

declare interface SsvOptions extends OperationOptions {
}

declare type String_2 = string;
export { String_2 as String }

export { }
