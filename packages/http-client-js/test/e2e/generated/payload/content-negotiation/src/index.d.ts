import { ClientOptions } from '@typespec/ts-http-runtime';
import { PathUncheckedResponse } from '@typespec/ts-http-runtime';

export declare type Bytes = Uint8Array;

export declare class ContentNegotiationClient {
    #private;
    sameBodyClient: SameBodyClient;
    differentBodyClient: DifferentBodyClient;
    constructor(options?: ContentNegotiationClientOptions);
}

declare interface ContentNegotiationClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare function dateDeserializer(date?: string | null): Date;

export declare function dateRfc3339Serializer(date?: Date | null): string;

export declare function dateRfc7231Deserializer(date?: string | null): Date;

export declare function dateRfc7231Serializer(date?: Date | null): string;

export declare function dateUnixTimestampDeserializer(date?: number | null): Date;

export declare function dateUnixTimestampSerializer(date?: Date | null): number;

export declare function decodeBase64(value: string): Uint8Array | undefined;

export declare class DifferentBodyClient {
    #private;
    constructor(options?: DifferentBodyClientOptions);
    getAvatarAsPng(options?: GetAvatarAsPngOptions_2): Promise<Uint8Array<ArrayBufferLike>>;
    getAvatarAsJson(options?: GetAvatarAsJsonOptions): Promise<{
        content: Uint8Array;
    }>;
}

declare interface DifferentBodyClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare function encodeUint8Array(value: Uint8Array | undefined | null, encoding: BufferEncoding): string | undefined;

declare interface GetAvatarAsJpegOptions extends OperationOptions {
    accept?: "image/jpeg";
}

declare interface GetAvatarAsJsonOptions extends OperationOptions {
    accept?: "application/json";
}

declare interface GetAvatarAsPngOptions extends OperationOptions {
    accept?: "image/png";
}

declare interface GetAvatarAsPngOptions_2 extends OperationOptions {
    accept?: "image/png";
}

declare interface OperationOptions {
    operationOptions?: {
        onResponse?: (rawResponse: PathUncheckedResponse) => void;
    };
}

export declare class SameBodyClient {
    #private;
    constructor(options?: SameBodyClientOptions);
    getAvatarAsPng(options?: GetAvatarAsPngOptions): Promise<Uint8Array<ArrayBufferLike>>;
    getAvatarAsJpeg(options?: GetAvatarAsJpegOptions): Promise<Uint8Array<ArrayBufferLike>>;
}

declare interface SameBodyClientOptions extends ClientOptions {
    endpoint?: string;
}

declare type String_2 = string;
export { String_2 as String }

export { }
