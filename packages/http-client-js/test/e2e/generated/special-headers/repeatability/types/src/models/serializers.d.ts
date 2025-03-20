export declare function decodeBase64(value: string): Uint8Array | undefined;
export declare function encodeUint8Array(value: Uint8Array | undefined | null, encoding: BufferEncoding): string | undefined;
export declare function dateDeserializer(date?: string | null): Date;
export declare function dateRfc7231Deserializer(date?: string | null): Date;
export declare function dateRfc3339Serializer(date?: Date | null): string;
export declare function dateRfc7231Serializer(date?: Date | null): string;
export declare function dateUnixTimestampSerializer(date?: Date | null): number;
export declare function dateUnixTimestampDeserializer(date?: number | null): Date;
//# sourceMappingURL=serializers.d.ts.map