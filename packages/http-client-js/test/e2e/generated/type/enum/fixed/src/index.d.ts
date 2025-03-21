import { ClientOptions } from '@typespec/ts-http-runtime';
import { PathUncheckedResponse } from '@typespec/ts-http-runtime';

export declare function dateDeserializer(date?: string | null): Date;

export declare function dateRfc3339Serializer(date?: Date | null): string;

export declare function dateRfc7231Deserializer(date?: string | null): Date;

export declare function dateRfc7231Serializer(date?: Date | null): string;

export declare function dateUnixTimestampDeserializer(date?: number | null): Date;

export declare function dateUnixTimestampSerializer(date?: Date | null): number;

export declare enum DaysOfWeekEnum {
    Monday = "Monday",
    Tuesday = "Tuesday",
    Wednesday = "Wednesday",
    Thursday = "Thursday",
    Friday = "Friday",
    Saturday = "Saturday",
    Sunday = "Sunday"
}

export declare function decodeBase64(value: string): Uint8Array | undefined;

export declare function encodeUint8Array(value: Uint8Array | undefined | null, encoding: BufferEncoding): string | undefined;

export declare class FixedClient {
    #private;
    stringClient: StringClient;
    constructor(options?: FixedClientOptions);
}

declare interface FixedClientOptions extends ClientOptions {
    endpoint?: string;
}

declare interface GetKnownValueOptions extends OperationOptions {
}

declare interface OperationOptions {
    operationOptions?: {
        onResponse?: (rawResponse: PathUncheckedResponse) => void;
    };
}

declare interface PutKnownValueOptions extends OperationOptions {
}

export declare function putKnownValuePayloadToTransport(payload: DaysOfWeekEnum): DaysOfWeekEnum;

declare interface PutUnknownValueOptions extends OperationOptions {
}

export declare function putUnknownValuePayloadToTransport(payload: DaysOfWeekEnum): DaysOfWeekEnum;

declare type String_2 = string;
export { String_2 as String }

export declare class StringClient {
    #private;
    constructor(options?: StringClientOptions);
    getKnownValue(options?: GetKnownValueOptions): Promise<DaysOfWeekEnum>;
    putKnownValue(body: DaysOfWeekEnum, options?: PutKnownValueOptions): Promise<void>;
    putUnknownValue(body: DaysOfWeekEnum, options?: PutUnknownValueOptions): Promise<void>;
}

declare interface StringClientOptions extends ClientOptions {
    endpoint?: string;
}

export { }
