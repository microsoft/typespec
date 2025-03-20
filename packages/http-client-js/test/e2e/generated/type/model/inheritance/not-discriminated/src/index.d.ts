import { ClientOptions } from '@typespec/ts-http-runtime';
import { PathUncheckedResponse } from '@typespec/ts-http-runtime';

declare type Boolean_2 = boolean;
export { Boolean_2 as Boolean }

export declare interface Cat extends Pet {
    "age": number;
}

export declare function dateDeserializer(date?: string | null): Date;

export declare function dateRfc3339Serializer(date?: Date | null): string;

export declare function dateRfc7231Deserializer(date?: string | null): Date;

export declare function dateRfc7231Serializer(date?: Date | null): string;

export declare function dateUnixTimestampDeserializer(date?: number | null): Date;

export declare function dateUnixTimestampSerializer(date?: Date | null): number;

export declare function decodeBase64(value: string): Uint8Array | undefined;

export declare function encodeUint8Array(value: Uint8Array | undefined | null, encoding: BufferEncoding): string | undefined;

declare interface GetValidOptions extends OperationOptions {
}

export declare type Int32 = number;

export declare type Int64 = bigint;

export declare type Integer = number;

export declare function jsonCatToApplicationTransform(input_?: any): Cat;

export declare function jsonCatToTransportTransform(input_?: Cat | null): any;

export declare function jsonPetToApplicationTransform(input_?: any): Pet;

export declare function jsonPetToTransportTransform(input_?: Pet | null): any;

export declare function jsonSiameseToApplicationTransform(input_?: any): Siamese;

export declare function jsonSiameseToTransportTransform(input_?: Siamese | null): any;

export declare class NotDiscriminatedClient {
    #private;
    constructor(options?: NotDiscriminatedClientOptions);
    postValid(input: Siamese, options?: PostValidOptions): Promise<void>;
    getValid(options?: GetValidOptions): Promise<Siamese>;
    putValid(input: Siamese, options?: PutValidOptions): Promise<Siamese>;
}

declare interface NotDiscriminatedClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare type Numeric = number;

declare interface OperationOptions {
    operationOptions?: {
        onResponse?: (rawResponse: PathUncheckedResponse) => void;
    };
}

export declare interface Pet {
    "name": string;
}

declare interface PostValidOptions extends OperationOptions {
}

export declare function postValidPayloadToTransport(payload: Siamese): any;

declare interface PutValidOptions extends OperationOptions {
}

export declare function putValidPayloadToTransport(payload: Siamese): any;

export declare interface Siamese extends Cat {
    "smart": boolean;
}

declare type String_2 = string;
export { String_2 as String }

export { }
