import { ClientOptions } from '@typespec/ts-http-runtime';
import { PathUncheckedResponse } from '@typespec/ts-http-runtime';
import { TokenCredential } from '@typespec/ts-http-runtime';

export declare function dateDeserializer(date?: string | null): Date;

export declare function dateRfc3339Serializer(date?: Date | null): string;

export declare function dateRfc7231Deserializer(date?: string | null): Date;

export declare function dateRfc7231Serializer(date?: Date | null): string;

export declare function dateUnixTimestampDeserializer(date?: number | null): Date;

export declare function dateUnixTimestampSerializer(date?: Date | null): number;

export declare function decodeBase64(value: string): Uint8Array | undefined;

export declare function encodeUint8Array(value: Uint8Array | undefined | null, encoding: BufferEncoding): string | undefined;

declare interface InvalidOptions extends OperationOptions {
}

export declare class OAuth2Client {
    #private;
    constructor(credential: TokenCredential, options?: OAuth2ClientOptions);
    valid(options?: ValidOptions): Promise<void>;
    invalid(options?: InvalidOptions): Promise<void>;
}

declare interface OAuth2ClientOptions extends ClientOptions {
    endpoint?: string;
}

declare interface OperationOptions {
    operationOptions?: {
        onResponse?: (rawResponse: PathUncheckedResponse) => void;
    };
}

declare type String_2 = string;
export { String_2 as String }

declare interface ValidOptions extends OperationOptions {
}

export { }
