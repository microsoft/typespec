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

export declare type Int32 = number;

export declare type Int64 = bigint;

export declare type Integer = number;

export declare function jsonNewModelToApplicationTransform(input_?: any): NewModel;

export declare function jsonNewModelToTransportTransform(input_?: NewModel | null): any;

export declare function jsonNewUnionToApplicationTransform(input_?: any): NewUnion;

export declare function jsonNewUnionToTransportTransform(input_?: NewUnion | null): any;

export declare enum NewEnum {
    NewEnumMember = "newEnumMember"
}

export declare class NewInterfaceClient {
    #private;
    constructor(endpoint: string, version: Versions, options?: NewInterfaceClientOptions);
    newOpInNewInterface(body: NewModel, options?: NewOpInNewInterfaceOptions): Promise<NewModel>;
}

declare interface NewInterfaceClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare interface NewModel {
    "newProp": string;
    "enumProp": NewEnum;
    "unionProp": NewUnion;
}

declare interface NewOpInNewInterfaceOptions extends OperationOptions {
}

export declare function newOpInNewInterfacePayloadToTransport(payload: NewModel): any;

declare interface NewOpOptions extends OperationOptions {
}

export declare function newOpPayloadToTransport(payload: NewModel): any;

export declare type NewScalar = number;

export declare type NewUnion = string | number;

export declare type Numeric = number;

declare interface OperationOptions {
    operationOptions?: {
        onResponse?: (rawResponse: PathUncheckedResponse) => void;
    };
}

export declare class RenamedFromClient {
    #private;
    newInterfaceClient: NewInterfaceClient;
    constructor(endpoint: string, version: Versions, options?: RenamedFromClientOptions);
    newOp(body: NewModel, newQuery: string, options?: NewOpOptions): Promise<NewModel>;
}

declare interface RenamedFromClientOptions extends ClientOptions {
    endpoint?: string;
}

declare type String_2 = string;
export { String_2 as String }

export declare type Url = string;

export declare enum Versions {
    V1 = "v1",
    V2 = "v2"
}

export { }
