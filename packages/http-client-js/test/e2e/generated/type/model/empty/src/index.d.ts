import { ClientOptions } from '@typespec/ts-http-runtime';
import { PathUncheckedResponse } from '@typespec/ts-http-runtime';

export declare function dateDeserializer(date?: string | null): Date;

export declare function dateRfc3339Serializer(date?: Date | null): string;

export declare function dateRfc7231Deserializer(date?: string | null): Date;

export declare function dateRfc7231Serializer(date?: Date | null): string;

export declare function dateUnixTimestampDeserializer(date?: number | null): Date;

export declare function dateUnixTimestampSerializer(date?: Date | null): number;

export declare function decodeBase64(value: string): Uint8Array | undefined;

export declare class EmptyClient {
    #private;
    constructor(options?: EmptyClientOptions);
    putEmpty(input: EmptyInput, options?: PutEmptyOptions): Promise<void>;
    getEmpty(options?: GetEmptyOptions): Promise<EmptyOutput>;
    postRoundTripEmpty(body: EmptyInputOutput, options?: PostRoundTripEmptyOptions): Promise<EmptyInputOutput>;
}

declare interface EmptyClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare interface EmptyInput {
}

export declare interface EmptyInputOutput {
}

export declare interface EmptyOutput {
}

export declare function encodeUint8Array(value: Uint8Array | undefined | null, encoding: BufferEncoding): string | undefined;

declare interface GetEmptyOptions extends OperationOptions {
}

export declare function jsonEmptyInputOutputToApplicationTransform(input_?: any): EmptyInputOutput;

export declare function jsonEmptyInputOutputToTransportTransform(input_?: EmptyInputOutput | null): any;

export declare function jsonEmptyInputToApplicationTransform(input_?: any): EmptyInput;

export declare function jsonEmptyInputToTransportTransform(input_?: EmptyInput | null): any;

export declare function jsonEmptyOutputToApplicationTransform(input_?: any): EmptyOutput;

export declare function jsonEmptyOutputToTransportTransform(input_?: EmptyOutput | null): any;

declare interface OperationOptions {
    operationOptions?: {
        onResponse?: (rawResponse: PathUncheckedResponse) => void;
    };
}

declare interface PostRoundTripEmptyOptions extends OperationOptions {
}

export declare function postRoundTripEmptyPayloadToTransport(payload: EmptyInputOutput): any;

declare interface PutEmptyOptions extends OperationOptions {
}

export declare function putEmptyPayloadToTransport(payload: EmptyInput): any;

declare type String_2 = string;
export { String_2 as String }

export { }
