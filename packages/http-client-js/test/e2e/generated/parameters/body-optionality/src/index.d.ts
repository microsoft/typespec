import { ClientOptions } from '@typespec/ts-http-runtime';
import { PathUncheckedResponse } from '@typespec/ts-http-runtime';

export declare interface BodyModel {
    "name": string;
}

export declare class BodyOptionalityClient {
    #private;
    optionalExplicitClient: OptionalExplicitClient;
    constructor(options?: BodyOptionalityClientOptions);
    requiredExplicit(body: BodyModel, options?: RequiredExplicitOptions): Promise<void>;
    requiredImplicit(name: string, options?: RequiredImplicitOptions): Promise<void>;
}

declare interface BodyOptionalityClientOptions extends ClientOptions {
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

export declare function jsonBodyModelToApplicationTransform(input_?: any): BodyModel;

export declare function jsonBodyModelToTransportTransform(input_?: BodyModel | null): any;

declare interface OmitOptions extends OperationOptions {
    body?: BodyModel;
}

export declare function omitPayloadToTransport(payload: BodyModel): any;

declare interface OperationOptions {
    operationOptions?: {
        onResponse?: (rawResponse: PathUncheckedResponse) => void;
    };
}

export declare class OptionalExplicitClient {
    #private;
    constructor(options?: OptionalExplicitClientOptions);
    set(options?: SetOptions): Promise<void>;
    omit(options?: OmitOptions): Promise<void>;
}

declare interface OptionalExplicitClientOptions extends ClientOptions {
    endpoint?: string;
}

declare interface RequiredExplicitOptions extends OperationOptions {
}

export declare function requiredExplicitPayloadToTransport(payload: BodyModel): any;

declare interface RequiredImplicitOptions extends OperationOptions {
}

declare interface SetOptions extends OperationOptions {
    body?: BodyModel;
}

export declare function setPayloadToTransport(payload: BodyModel): any;

declare type String_2 = string;
export { String_2 as String }

export { }
