import { ClientOptions } from '@typespec/ts-http-runtime';
import { PathUncheckedResponse } from '@typespec/ts-http-runtime';

export declare class BasicClient {
    #private;
    explicitBodyClient: ExplicitBodyClient;
    implicitBodyClient: ImplicitBodyClient;
    constructor(options?: BasicClientOptions);
}

declare interface BasicClientOptions extends ClientOptions {
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

export declare class ExplicitBodyClient {
    #private;
    constructor(options?: ExplicitBodyClientOptions);
    simple(body: User, options?: SimpleOptions): Promise<void>;
}

declare interface ExplicitBodyClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare class ImplicitBodyClient {
    #private;
    constructor(options?: ImplicitBodyClientOptions);
    simple(name: string, options?: SimpleOptions_2): Promise<void>;
}

declare interface ImplicitBodyClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare function jsonUserToApplicationTransform(input_?: any): User;

export declare function jsonUserToTransportTransform(input_?: User | null): any;

declare interface OperationOptions {
    operationOptions?: {
        onResponse?: (rawResponse: PathUncheckedResponse) => void;
    };
}

declare interface SimpleOptions extends OperationOptions {
}

declare interface SimpleOptions_2 extends OperationOptions {
}

export declare function simplePayloadToTransport(payload: User): any;

declare type String_2 = string;
export { String_2 as String }

export declare interface User {
    "name": string;
}

export { }
