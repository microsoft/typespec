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

declare interface InputAndOutputOptions extends OperationOptions {
}

export declare function inputAndOutputPayloadToTransport(payload: InputOutputRecord): any;

declare interface InputOptions extends OperationOptions {
}

export declare interface InputOutputRecord {
    "requiredProp": string;
}

export declare function inputPayloadToTransport(payload: InputRecord): any;

export declare interface InputRecord {
    "requiredProp": string;
}

export declare function jsonInputOutputRecordToApplicationTransform(input_?: any): InputOutputRecord;

export declare function jsonInputOutputRecordToTransportTransform(input_?: InputOutputRecord | null): any;

export declare function jsonInputRecordToApplicationTransform(input_?: any): InputRecord;

export declare function jsonInputRecordToTransportTransform(input_?: InputRecord | null): any;

export declare function jsonOutputRecordToApplicationTransform(input_?: any): OutputRecord;

export declare function jsonOutputRecordToTransportTransform(input_?: OutputRecord | null): any;

declare interface OperationOptions {
    operationOptions?: {
        onResponse?: (rawResponse: PathUncheckedResponse) => void;
    };
}

declare interface OutputOptions extends OperationOptions {
}

export declare interface OutputRecord {
    "requiredProp": string;
}

declare type String_2 = string;
export { String_2 as String }

export declare class UsageClient {
    #private;
    constructor(options?: UsageClientOptions);
    input(input: InputRecord, options?: InputOptions): Promise<any>;
    output(options?: OutputOptions): Promise<OutputRecord>;
    inputAndOutput(body: InputOutputRecord, options?: InputAndOutputOptions): Promise<InputOutputRecord>;
}

declare interface UsageClientOptions extends ClientOptions {
    endpoint?: string;
}

export { }
