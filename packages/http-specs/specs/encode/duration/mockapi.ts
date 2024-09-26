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
    mockMethods: [
      {
        method: "post",
        request: {
          body: data,
        },
        response: {
          status: 200,
          data: data,
        },
        handler: (req: MockRequest) => {
          req.expect.coercedBodyEquals({ value: value });
          return {
            status: 200,
            body: json({ value: value }),
          };
        },
      },
    ],
  });
}
Scenarios.Encode_Duration_Property_Default = createBodyServerTests(
  "/encode/duration/property/default",
  {
    value: "P40D",
  },
  "P40D",
);
Scenarios.Encode_Duration_Float_Seconds = createBodyServerTests(
  "/encode/duration/property/float-seconds",
  {
    value: 35.625,
  },
  35.625,
);
Scenarios.Encode_Duration_Float64_Seconds = createBodyServerTests(
  "/encode/duration/property/float64-seconds",
  {
    value: 35.625,
  },
  35.625,
);
Scenarios.Encode_Duration_Int32_Seconds = createBodyServerTests(
  "/encode/duration/property/int32-seconds",
  {
    value: 36,
  },
  36,
);
Scenarios.Encode_Duration_Iso8601 = createBodyServerTests(
  "/encode/duration/property/iso8601",
  {
    value: "P40D",
  },
  "P40D",
);
Scenarios.Encode_Duration_Float_Seconds_Array = createBodyServerTests(
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
    mockMethods: [
      {
        method: "get",
        request: {
          config: {
            params: paramData,
          },
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
      },
    ],
  });
}
Scenarios.Encode_Duration_Query_Default = createQueryServerTests(
  "/encode/duration/query/default",
  {
    input: "P40D",
  },
  "P40D",
);
Scenarios.Encode_Duration_Query_Iso8601 = createQueryServerTests(
  "/encode/duration/query/iso8601",
  {
    input: "P40D",
  },
  "P40D",
);
Scenarios.Encode_Duration_Query_Int32_Seconds = createQueryServerTests(
  "/encode/duration/query/int32-seconds",
  {
    input: 36,
  },
  "36",
);
Scenarios.Encode_Duration_Query_Int32_Seconds_Array = createQueryServerTests(
  "/encode/duration/query/int32-seconds-array",
  {
    input: [36, 47].join(","),
  },
  ["36", "47"],
  "csv",
);
Scenarios.Encode_Duration_Query_Float_Seconds = createQueryServerTests(
  "/encode/duration/query/float-seconds",
  {
    input: 35.625,
  },
  "35.625",
);
Scenarios.Encode_Duration_Query_Float64_Seconds = createQueryServerTests(
  "/encode/duration/query/float64-seconds",
  {
    input: 35.625,
  },
  "35.625",
);

function createHeaderServerTests(uri: string, headersData: any, value: any) {
  return passOnSuccess({
    uri,
    mockMethods: [
      {
        method: "get",
        request: {
          config: {
            headers: headersData,
          },
        },
        response: {
          status: 204,
        },
        handler: (req: MockRequest) => {
          req.expect.containsHeader("duration", value);
          return {
            status: 204,
          };
        },
      },
    ],
  });
}

Scenarios.Encode_Duration_Header_Default = createHeaderServerTests(
  "/encode/duration/header/default",
  {
    duration: "P40D",
  },
  "P40D",
);
Scenarios.Encode_Duration_Header_Iso8601 = createHeaderServerTests(
  "/encode/duration/header/iso8601",
  {
    duration: "P40D",
  },
  "P40D",
);
Scenarios.Encode_Duration_Header_Int32_Seconds = createHeaderServerTests(
  "/encode/duration/header/int32-seconds",
  {
    duration: 36,
  },
  "36",
);
Scenarios.Encode_Duration_Header_Float_Seconds = createHeaderServerTests(
  "/encode/duration/header/float-seconds",
  {
    duration: 35.625,
  },
  "35.625",
);
Scenarios.Encode_Duration_Header_Float64_Seconds = createHeaderServerTests(
  "/encode/duration/header/float64-seconds",
  {
    duration: 35.625,
  },
  "35.625",
);
Scenarios.Encode_Duration_Header_Iso8601_Array = createHeaderServerTests(
  "/encode/duration/header/iso8601-array",
  {
    duration: ["P40D", "P50D"].join(","),
  },
  "P40D,P50D",
);
