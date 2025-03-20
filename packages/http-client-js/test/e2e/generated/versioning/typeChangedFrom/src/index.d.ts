import { ClientOptions } from '@typespec/ts-http-runtime';
import { PathUncheckedResponse } from '@typespec/ts-http-runtime';

export declare function dateDeserializer(date?: string | null): Date;

export declare function dateRfc3339Serializer(date?: Date | null): string;

export declare function dateRfc7231Deserializer(date?: string | null): Date;

export declare function dateRfc7231Serializer(date?: Date | null): string;

export declare function dateUnixTimestampDeserializer(date?: number | null): Date;

export declare function dateUnixTimestampSerializer(date?: Date | null): number;

export declare function decodeBase64(value: string): Uint8Array | undefined;

export declare function encodeUint8Array(value: Uint8Array | undefined | null, encoding: BufferEncoding): string | undefined;

export declare function jsonTestModelToApplicationTransform(input_?: any): TestModel;

export declare function jsonTestModelToTransportTransform(input_?: TestModel | null): any;

declare interface OperationOptions {
    operationOptions?: {
        onResponse?: (rawResponse: PathUncheckedResponse) => void;
    };
}

declare type String_2 = string;
export { String_2 as String }

export declare interface TestModel {
    "prop": string;
    "changedProp": string;
}

declare interface TestOptions extends OperationOptions {
}

export declare function testPayloadToTransport(payload: TestModel): any;

export declare class TypeChangedFromClient {
    #private;
    constructor(endpoint: string, version: Versions, options?: TypeChangedFromClientOptions);
    test(body: TestModel, param: string, options?: TestOptions): Promise<TestModel>;
}

declare interface TypeChangedFromClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare type Url = string;

export declare enum Versions {
    V1 = "v1",
    V2 = "v2"
}

export { }
