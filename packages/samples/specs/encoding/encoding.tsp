import "@typespec/rest";

using Http;

@service
namespace EncodingSample;

model Encodings {
  datetime: {
    // RFC3339 for json (default)
    default: utcDateTime;

    // Rfc7231 when in header (default)
    @header inHeader: utcDateTime;

    @encode(DateTimeKnownEncoding.rfc3339)
    rfc3339: utcDateTime;

    @encode(DateTimeKnownEncoding.rfc7231)
    rfc7231: utcDateTime;

    rfc7231ViaScalar: myRfc7231DateTime;

    @encode(DateTimeKnownEncoding.unixTimestamp, int32)
    unixtime: utcDateTime;

    unixtimeViaScalar: myUnixTimestamp;
  };
  duration: {
    // ISO8601 for JSON
    default: duration;

    @encode(DurationKnownEncoding.ISO8601)
    durationISO: duration;

    @encode(DurationKnownEncoding.seconds, int32)
    durationSecondsInt32: duration;

    @encode(DurationKnownEncoding.seconds, float32)
    durationSecondsFloat32: duration;
  };
  bytes: {
    // Base64 for JSON
    default: bytes;

    @encode(BytesKnownEncoding.base64)
    base64: bytes;

    @encode(BytesKnownEncoding.base64url)
    base64url: bytes;
  };
}

@encode(DateTimeKnownEncoding.rfc7231)
scalar myRfc7231DateTime extends utcDateTime;

@encode(DateTimeKnownEncoding.unixTimestamp, int32)
scalar myUnixTimestamp extends utcDateTime;

op read(): Encodings;
