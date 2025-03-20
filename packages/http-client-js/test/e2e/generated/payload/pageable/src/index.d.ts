import { ClientOptions } from '@typespec/ts-http-runtime';
import { PathUncheckedResponse } from '@typespec/ts-http-runtime';

export declare class ContinuationTokenClient {
    #private;
    constructor(options?: ContinuationTokenClientOptions);
    requestQueryResponseBody(options?: RequestQueryResponseBodyOptions): Promise<{
        pets: Array<Pet>;
        nextToken?: string;
    }>;
    requestHeaderResponseBody(options?: RequestHeaderResponseBodyOptions): Promise<{
        pets: Array<Pet>;
        nextToken?: string;
    }>;
    requestQueryResponseHeader(options?: RequestQueryResponseHeaderOptions): Promise<{
        pets: Array<Pet>;
    }>;
    requestHeaderResponseHeader(options?: RequestHeaderResponseHeaderOptions): Promise<{
        pets: Array<Pet>;
    }>;
}

declare interface ContinuationTokenClientOptions extends ClientOptions {
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

export declare function jsonArrayPetToApplicationTransform(items_?: any): Array<Pet>;

export declare function jsonArrayPetToTransportTransform(items_?: Array<Pet> | null): any;

export declare function jsonPetToApplicationTransform(input_?: any): Pet;

export declare function jsonPetToTransportTransform(input_?: Pet | null): any;

declare interface LinkOptions extends OperationOptions {
}

declare interface OperationOptions {
    operationOptions?: {
        onResponse?: (rawResponse: PathUncheckedResponse) => void;
    };
}

export declare interface Pet {
    "id": string;
    "name": string;
}

declare interface RequestHeaderResponseBodyOptions extends OperationOptions {
    token?: string;
    foo?: string;
    bar?: string;
}

declare interface RequestHeaderResponseHeaderOptions extends OperationOptions {
    token?: string;
    foo?: string;
    bar?: string;
}

declare interface RequestQueryResponseBodyOptions extends OperationOptions {
    token?: string;
    foo?: string;
    bar?: string;
}

declare interface RequestQueryResponseHeaderOptions extends OperationOptions {
    token?: string;
    foo?: string;
    bar?: string;
}

export declare class ServerDrivenPaginationClient {
    #private;
    continuationTokenClient: ContinuationTokenClient;
    constructor(options?: ServerDrivenPaginationClientOptions);
    link(options?: LinkOptions): Promise<{
        pets: Array<Pet>;
        next?: string;
    }>;
}

declare interface ServerDrivenPaginationClientOptions extends ClientOptions {
    endpoint?: string;
}

declare type String_2 = string;
export { String_2 as String }

export declare type Url = string;

export { }
