import "@typespec/rest";
import "@azure-tools/typespec-client-generator-core";

using TypeSpec.Http;
using Azure.ClientGenerator.Core;

@service({
  title: "Builtin",
})
namespace Cadl.Builtin;

model Builtin {
  boolean: boolean;
  string: string;
  bytes: bytes;
  int: int32;
  safeint: safeint;
  decimal: decimal;
  long: int64;
  float: float32;
  double: float64;
  duration: duration;
  date: plainDate;
  dateTime: utcDateTime;
  stringList: string[];
  bytesDict: Record<bytes>;
  url: url;
  nullableFloatDict: Record<float64 | null>;
  encoded: Encoded;
}

@encode(DurationKnownEncoding.seconds, float32)
scalar myDuration extends duration;

model Encoded {
  @encode(DurationKnownEncoding.seconds, int32)
  timeInSeconds?: duration;

  timeInSecondsFraction?: myDuration;

  @encode(DateTimeKnownEncoding.rfc3339)
  dateTime?: utcDateTime;

  @encode(DateTimeKnownEncoding.rfc7231)
  dateTimeRfc7231?: utcDateTime;

  @encode(DateTimeKnownEncoding.unixTimestamp, int64)
  unixTimestamp?: utcDateTime;

  @encode(BytesKnownEncoding.base64)
  base64?: bytes;

  @encode(BytesKnownEncoding.base64url)
  base64url?: bytes;
}

model Request {
  @header("x-ms-date")
  dateTime?: utcDateTime;

  @query
  filter?: string;

  @query("query")
  queryParam: string;

  @query("query-encoded")
  queryParamEncoded: url;

  @query("query-opt")
  queryParamOptional?: string;

  @query("query-opt-encoded")
  queryParamOptionalEncoded?: url;
}

@route("/builtin")
interface BuiltinOp {
  read(...Request): {
    @body body: Builtin;
  };

  @convenientAPI(false)
  write(@body body: Builtin): OkResponse;
}
