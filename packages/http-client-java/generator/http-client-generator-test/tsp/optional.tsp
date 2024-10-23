import "@typespec/rest";

using TypeSpec.Http;

@service({
  title: "Optional",
})
namespace Cadl.Optional;

model Optional {
  boolean?: boolean = true;
  booleanNullable?: boolean | null;
  booleanRequired: boolean;
  booleanRequiredNullable: boolean | null;
  string?: string;
  stringNullable?: string | null;
  stringRequired: string;
  stringRequiredNullable: string | null;
  bytes?: bytes;
  int?: int32;
  long?: int64;
  float?: float32;
  double?: float64;
  duration?: duration;
  dateTime?: utcDateTime;
  stringList?: string[];
  bytesDict?: Record<bytes>;

  @encode(DateTimeKnownEncoding.unixTimestamp, int64)
  epochDateTimeRequiredNullable: utcDateTime | null;

  @encode(DateTimeKnownEncoding.unixTimestamp, int64)
  epochDateTimeNullable?: utcDateTime;
}

model Immutable {
  stringReadWriteRequired: string;

  @visibility("read")
  stringReadOnlyOptional?: string;
}

@withOptionalProperties
model AllPropertiesOptional {
  ...Optional;
  immutable: Immutable;
}

@route("/optional")
interface OptionalOp {
  @put
  @route("/put")
  put(
    @header requestHeaderRequired: string,
    @header requestHeaderOptional?: string = "test-header",
    @query booleanRequired: boolean,
    @query booleanNullable?: boolean | null,
    @query booleanRequiredNullable: boolean | null,
    @query string?: string,
    @query stringNullable?: string | null,
    @query stringRequired: string,
    @query stringRequiredNullable: string | null,
    @body Optional?: Optional,
  ): {
    @header headerRequired: string;
    @header headerOptional?: string;
    @body body?: AllPropertiesOptional;
  };
}
