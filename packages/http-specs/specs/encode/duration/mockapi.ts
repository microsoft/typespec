import {
  CollectionFormat,
  json,
  MockRequest,
  passOnSuccess,
  ScenarioMockApi,
  ValidationError,
} from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

function createBodyServerTests(uri: string, data: any, value: any) {
  return passOnSuccess({
    uri,
    method: "post",
    request: {
      body: json(data),
    },
    response: {
      status: 200,
      body: json(data),
    },
    kind: "MockApiDefinition",
  });
}

// Validates that a duration whose value carries more precision than the target encoding (a lossy
// encode) is serialized as an integer. The allowed values cover floor, round and ceil so the test
// does not take a position on an emitter's rounding mode while still rejecting floating point output.
function createLossyBodyServerTests(uri: string, allowed: number[]) {
  return passOnSuccess({
    uri,
    method: "post",
    request: {
      body: json({ value: allowed[0] }),
    },
    response: {
      status: 200,
      body: json({ value: allowed[0] }),
    },
    handler: (req: MockRequest) => {
      const value = req.body?.value;
      if (typeof value !== "number" || !Number.isInteger(value)) {
        throw new ValidationError(
          `Expected body property "value" to be serialized as an integer but got ${value}`,
          "an integer",
          value,
        );
      }
      if (!allowed.includes(value)) {
        throw new ValidationError(
          `Expected body property "value" to be one of ${allowed.join(", ")} but got ${value}`,
          allowed.join(" | "),
          value,
        );
      }
      return {
        status: 200,
        body: json({ value }),
      };
    },
    kind: "MockApiDefinition",
  });
}
Scenarios.Encode_Duration_Property_default = createBodyServerTests(
  "/encode/duration/property/default",
  {
    value: "P40D",
  },
  "P40D",
);
Scenarios.Encode_Duration_Property_floatSeconds = createBodyServerTests(
  "/encode/duration/property/float-seconds",
  {
    value: 35.625,
  },
  35.625,
);
Scenarios.Encode_Duration_Property_float64Seconds = createBodyServerTests(
  "/encode/duration/property/float64-seconds",
  {
    value: 35.625,
  },
  35.625,
);
Scenarios.Encode_Duration_Property_int32Seconds = createBodyServerTests(
  "/encode/duration/property/int32-seconds",
  {
    value: 36,
  },
  36,
);
Scenarios.Encode_Duration_Property_iso8601 = createBodyServerTests(
  "/encode/duration/property/iso8601",
  {
    value: "P40D",
  },
  "P40D",
);
Scenarios.Encode_Duration_Property_floatSecondsArray = createBodyServerTests(
  "/encode/duration/property/float-seconds-array",
  {
    value: [35.625, 46.75],
  },
  [35.625, 46.75],
);

Scenarios.Encode_Duration_Property_int32Milliseconds = createBodyServerTests(
  "/encode/duration/property/int32-milliseconds",
  {
    value: 36000,
  },
  36000,
);
Scenarios.Encode_Duration_Property_floatMilliseconds = createBodyServerTests(
  "/encode/duration/property/float-milliseconds",
  {
    value: 35625,
  },
  35625,
);
Scenarios.Encode_Duration_Property_float64Milliseconds = createBodyServerTests(
  "/encode/duration/property/float64-milliseconds",
  {
    value: 35625,
  },
  35625,
);
Scenarios.Encode_Duration_Property_floatMillisecondsArray = createBodyServerTests(
  "/encode/duration/property/float-milliseconds-array",
  {
    value: [35625, 46750],
  },
  [35625, 46750],
);
Scenarios.Encode_Duration_Property_int32SecondsLargerUnit = createBodyServerTests(
  "/encode/duration/property/int32-seconds-larger-unit",
  {
    value: 120,
  },
  120,
);
Scenarios.Encode_Duration_Property_floatSecondsLargerUnit = createBodyServerTests(
  "/encode/duration/property/float-seconds-larger-unit",
  {
    value: 150.0,
  },
  150.0,
);
Scenarios.Encode_Duration_Property_int32MillisecondsLargerUnit = createBodyServerTests(
  "/encode/duration/property/int32-milliseconds-larger-unit",
  {
    value: 180000,
  },
  180000,
);
Scenarios.Encode_Duration_Property_floatMillisecondsLargerUnit = createBodyServerTests(
  "/encode/duration/property/float-milliseconds-larger-unit",
  {
    value: 210000.0,
  },
  210000.0,
);

function createQueryServerTests(
  uri: string,
  paramData: any,
  value: any,
  collectionFormat?: CollectionFormat,
) {
  return passOnSuccess({
    uri,
    method: "get",
    request: {
      query: paramData,
    },
    response: {
      status: 204,
    },
    handler: (req: MockRequest) => {
      req.expect.containsQueryParam("input", value, collectionFormat);
      return {
        status: 204,
      };
    },
    kind: "MockApiDefinition",
  });
}

function createQueryFloatServerTests(uri: string, paramData: any, value: number) {
  return passOnSuccess({
    uri,
    method: "get",
    request: {
      query: paramData,
    },
    response: {
      status: 204,
    },
    handler: (req: MockRequest) => {
      const actual = req.query["input"] as string;
      const actualNum = parseFloat(actual);
      if (isNaN(actualNum) || actualNum !== value) {
        throw new ValidationError(
          `Expected query param input=${value} but got ${actual}`,
          String(value),
          actual,
        );
      }
      return {
        status: 204,
      };
    },
    kind: "MockApiDefinition",
  });
}

// Validates that a duration whose value carries more precision than the target encoding (a lossy
// encode) is serialized as an integer. The allowed values cover floor, round and ceil so the test
// does not take a position on an emitter's rounding mode while still rejecting floating point output.
function createLossyQueryServerTests(uri: string, allowed: number[]) {
  return passOnSuccess({
    uri,
    method: "get",
    request: {
      query: {
        input: allowed[0],
      },
    },
    response: {
      status: 204,
    },
    handler: (req: MockRequest) => {
      const actual = req.query["input"] as string;
      if (!/^[-+]?\d+$/.test(actual)) {
        throw new ValidationError(
          `Expected query param input to be serialized as an integer but got ${actual}`,
          "an integer",
          actual,
        );
      }
      if (!allowed.map(String).includes(actual)) {
        throw new ValidationError(
          `Expected query param input to be one of ${allowed.join(", ")} but got ${actual}`,
          allowed.join(" | "),
          actual,
        );
      }
      return {
        status: 204,
      };
    },
    kind: "MockApiDefinition",
  });
}
Scenarios.Encode_Duration_Query_default = createQueryServerTests(
  "/encode/duration/query/default",
  {
    input: "P40D",
  },
  "P40D",
);
Scenarios.Encode_Duration_Query_iso8601 = createQueryServerTests(
  "/encode/duration/query/iso8601",
  {
    input: "P40D",
  },
  "P40D",
);
Scenarios.Encode_Duration_Query_int32Seconds = createQueryServerTests(
  "/encode/duration/query/int32-seconds",
  {
    input: 36,
  },
  "36",
);
Scenarios.Encode_Duration_Query_int32SecondsArray = createQueryServerTests(
  "/encode/duration/query/int32-seconds-array",
  {
    input: [36, 47].join(","),
  },
  ["36", "47"],
  "csv",
);
Scenarios.Encode_Duration_Query_floatSeconds = createQueryServerTests(
  "/encode/duration/query/float-seconds",
  {
    input: 35.625,
  },
  "35.625",
);
Scenarios.Encode_Duration_Query_float64Seconds = createQueryServerTests(
  "/encode/duration/query/float64-seconds",
  {
    input: 35.625,
  },
  "35.625",
);

Scenarios.Encode_Duration_Query_int32Milliseconds = createQueryServerTests(
  "/encode/duration/query/int32-milliseconds",
  {
    input: 36000,
  },
  "36000",
);
Scenarios.Encode_Duration_Query_floatMilliseconds = createQueryFloatServerTests(
  "/encode/duration/query/float-milliseconds",
  {
    input: 35625,
  },
  35625,
);
Scenarios.Encode_Duration_Query_float64Milliseconds = createQueryFloatServerTests(
  "/encode/duration/query/float64-milliseconds",
  {
    input: 35625,
  },
  35625,
);
Scenarios.Encode_Duration_Query_int32MillisecondsArray = createQueryServerTests(
  "/encode/duration/query/int32-milliseconds-array",
  {
    input: [36000, 47000].join(","),
  },
  ["36000", "47000"],
  "csv",
);
Scenarios.Encode_Duration_Query_int32SecondsLargerUnit = createQueryServerTests(
  "/encode/duration/query/int32-seconds-larger-unit",
  {
    input: 120,
  },
  "120",
);
Scenarios.Encode_Duration_Query_floatSecondsLargerUnit = createQueryFloatServerTests(
  "/encode/duration/query/float-seconds-larger-unit",
  {
    input: 150,
  },
  150,
);
Scenarios.Encode_Duration_Query_int32MillisecondsLargerUnit = createQueryServerTests(
  "/encode/duration/query/int32-milliseconds-larger-unit",
  {
    input: 180000,
  },
  "180000",
);
Scenarios.Encode_Duration_Query_floatMillisecondsLargerUnit = createQueryFloatServerTests(
  "/encode/duration/query/float-milliseconds-larger-unit",
  {
    input: 210000,
  },
  210000,
);

function createHeaderServerTests(uri: string, headersData: any, value: any) {
  return passOnSuccess({
    uri,
    method: "get",
    request: {
      headers: headersData,
    },
    response: {
      status: 204,
    },
    kind: "MockApiDefinition",
  });
}

function createHeaderFloatServerTests(uri: string, value: number) {
  return passOnSuccess({
    uri,
    method: "get",
    request: {
      headers: {
        duration: String(value),
      },
    },
    response: {
      status: 204,
    },
    handler: (req: MockRequest) => {
      const actual = req.headers["duration"];
      const actualNum = parseFloat(actual);
      if (isNaN(actualNum) || actualNum !== value) {
        throw new ValidationError(
          `Expected header duration=${value} but got ${actual}`,
          String(value),
          actual,
        );
      }
      return {
        status: 204,
      };
    },
    kind: "MockApiDefinition",
  });
}

// Validates that a duration whose value carries more precision than the target encoding (a lossy
// encode) is serialized as an integer. The allowed values cover floor, round and ceil so the test
// does not take a position on an emitter's rounding mode while still rejecting floating point output.
function createLossyHeaderServerTests(uri: string, allowed: number[]) {
  return passOnSuccess({
    uri,
    method: "get",
    request: {
      headers: {
        duration: String(allowed[0]),
      },
    },
    response: {
      status: 204,
    },
    handler: (req: MockRequest) => {
      const actual = req.headers["duration"];
      if (!/^[-+]?\d+$/.test(actual)) {
        throw new ValidationError(
          `Expected header duration to be serialized as an integer but got ${actual}`,
          "an integer",
          actual,
        );
      }
      if (!allowed.map(String).includes(actual)) {
        throw new ValidationError(
          `Expected header duration to be one of ${allowed.join(", ")} but got ${actual}`,
          allowed.join(" | "),
          actual,
        );
      }
      return {
        status: 204,
      };
    },
    kind: "MockApiDefinition",
  });
}

Scenarios.Encode_Duration_Header_default = createHeaderServerTests(
  "/encode/duration/header/default",
  {
    duration: "P40D",
  },
  "P40D",
);
Scenarios.Encode_Duration_Header_iso8601 = createHeaderServerTests(
  "/encode/duration/header/iso8601",
  {
    duration: "P40D",
  },
  "P40D",
);
Scenarios.Encode_Duration_Header_int32Seconds = createHeaderServerTests(
  "/encode/duration/header/int32-seconds",
  {
    duration: "36",
  },
  "36",
);
Scenarios.Encode_Duration_Header_floatSeconds = createHeaderServerTests(
  "/encode/duration/header/float-seconds",
  {
    duration: "35.625",
  },
  "35.625",
);
Scenarios.Encode_Duration_Header_float64Seconds = createHeaderServerTests(
  "/encode/duration/header/float64-seconds",
  {
    duration: "35.625",
  },
  "35.625",
);
Scenarios.Encode_Duration_Header_iso8601Array = createHeaderServerTests(
  "/encode/duration/header/iso8601-array",
  {
    duration: ["P40D", "P50D"].join(","),
  },
  "P40D,P50D",
);

Scenarios.Encode_Duration_Header_int32Milliseconds = createHeaderServerTests(
  "/encode/duration/header/int32-milliseconds",
  {
    duration: "36000",
  },
  "36000",
);
Scenarios.Encode_Duration_Header_floatMilliseconds = createHeaderFloatServerTests(
  "/encode/duration/header/float-milliseconds",
  35625,
);
Scenarios.Encode_Duration_Header_float64Milliseconds = createHeaderFloatServerTests(
  "/encode/duration/header/float64-milliseconds",
  35625,
);
Scenarios.Encode_Duration_Header_int32MillisecondsArray = createHeaderServerTests(
  "/encode/duration/header/int32-milliseconds-array",
  {
    duration: ["36000", "47000"].join(","),
  },
  "36000,47000",
);
Scenarios.Encode_Duration_Header_int32SecondsLargerUnit = createHeaderServerTests(
  "/encode/duration/header/int32-seconds-larger-unit",
  {
    duration: "120",
  },
  "120",
);
Scenarios.Encode_Duration_Header_floatSecondsLargerUnit = createHeaderFloatServerTests(
  "/encode/duration/header/float-seconds-larger-unit",
  150,
);
Scenarios.Encode_Duration_Header_int32MillisecondsLargerUnit = createHeaderServerTests(
  "/encode/duration/header/int32-milliseconds-larger-unit",
  {
    duration: "180000",
  },
  "180000",
);
Scenarios.Encode_Duration_Header_floatMillisecondsLargerUnit = createHeaderFloatServerTests(
  "/encode/duration/header/float-milliseconds-larger-unit",
  210000,
);

// Lossy encode scenarios: the source duration carries more precision than the target integer
// encoding, so floor/round/ceil are all acceptable results (e.g. 36.25s -> 36 or 37).
Scenarios.Encode_Duration_Lossy_Query_int32Seconds = createLossyQueryServerTests(
  "/encode/duration/lossy/query/int32-seconds",
  [36, 37],
);
Scenarios.Encode_Duration_Lossy_Query_int32Milliseconds = createLossyQueryServerTests(
  "/encode/duration/lossy/query/int32-milliseconds",
  [36250, 36251],
);
Scenarios.Encode_Duration_Lossy_Property_int32Seconds = createLossyBodyServerTests(
  "/encode/duration/lossy/property/int32-seconds",
  [36, 37],
);
Scenarios.Encode_Duration_Lossy_Property_int32Milliseconds = createLossyBodyServerTests(
  "/encode/duration/lossy/property/int32-milliseconds",
  [36250, 36251],
);
Scenarios.Encode_Duration_Lossy_Header_int32Seconds = createLossyHeaderServerTests(
  "/encode/duration/lossy/header/int32-seconds",
  [36, 37],
);
Scenarios.Encode_Duration_Lossy_Header_int32Milliseconds = createLossyHeaderServerTests(
  "/encode/duration/lossy/header/int32-milliseconds",
  [36250, 36251],
);
