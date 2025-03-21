import {
  CollectionFormat,
  json,
  MockRequest,
  passOnSuccess,
  ScenarioMockApi,
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
