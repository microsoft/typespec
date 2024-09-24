import {
  CollectionFormat,
  json,
  mockapi,
  MockApi,
  passOnSuccess,
  ScenarioMockApi,
} from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

function createQueryMockApis(
  route: string,
  value: any,
  collectionFormat?: CollectionFormat,
): MockApi {
  const url = `/encode/duration/query/${route}`;
  return mockapi.get(url, (req) => {
    req.expect.containsQueryParam("input", value, collectionFormat);
    return {
      status: 204,
    };
  });
}

function createPropertyMockApis(route: string, value: any): MockApi {
  const url = `/encode/duration/property/${route}`;
  return mockapi.post(url, (req) => {
    req.expect.coercedBodyEquals({ value: value });
    return {
      status: 200,
      body: json({ value: value }),
    };
  });
}

function createHeaderMockApis(route: string, value: any): MockApi {
  const url = `/encode/duration/header/${route}`;
  return mockapi.get(url, (req) => {
    req.expect.containsHeader("duration", value);
    return {
      status: 204,
    };
  });
}

Scenarios.Encode_Duration_Query_default = passOnSuccess(createQueryMockApis("default", "P40D"));
Scenarios.Encode_Duration_Query_iso8601 = passOnSuccess(createQueryMockApis("iso8601", "P40D"));
Scenarios.Encode_Duration_Query_int32Seconds = passOnSuccess(
  createQueryMockApis("int32-seconds", "36"),
);
Scenarios.Encode_Duration_Query_int32SecondsArray = passOnSuccess(
  createQueryMockApis("int32-seconds-array", ["36", "47"], "csv"),
);
Scenarios.Encode_Duration_Query_floatSeconds = passOnSuccess(
  createQueryMockApis("float-seconds", "35.625"),
);
Scenarios.Encode_Duration_Query_float64Seconds = passOnSuccess(
  createQueryMockApis("float64-seconds", "35.625"),
);

Scenarios.Encode_Duration_Property_default = passOnSuccess(
  createPropertyMockApis("default", "P40D"),
);
Scenarios.Encode_Duration_Property_iso8601 = passOnSuccess(
  createPropertyMockApis("iso8601", "P40D"),
);
Scenarios.Encode_Duration_Property_int32Seconds = passOnSuccess(
  createPropertyMockApis("int32-seconds", 36),
);
Scenarios.Encode_Duration_Property_floatSeconds = passOnSuccess(
  createPropertyMockApis("float-seconds", 35.625),
);
Scenarios.Encode_Duration_Property_float64Seconds = passOnSuccess(
  createPropertyMockApis("float64-seconds", 35.625),
);
Scenarios.Encode_Duration_Property_floatSecondsArray = passOnSuccess(
  createPropertyMockApis("float-seconds-array", [35.625, 46.75]),
);

Scenarios.Encode_Duration_Header_default = passOnSuccess(createHeaderMockApis("default", "P40D"));
Scenarios.Encode_Duration_Header_iso8601 = passOnSuccess(createHeaderMockApis("iso8601", "P40D"));
Scenarios.Encode_Duration_Header_iso8601Array = passOnSuccess(
  createHeaderMockApis("iso8601-array", "P40D,P50D"),
);
Scenarios.Encode_Duration_Header_int32Seconds = passOnSuccess(
  createHeaderMockApis("int32-seconds", "36"),
);
Scenarios.Encode_Duration_Header_floatSeconds = passOnSuccess(
  createHeaderMockApis("float-seconds", "35.625"),
);
Scenarios.Encode_Duration_Header_float64Seconds = passOnSuccess(
  createHeaderMockApis("float64-seconds", "35.625"),
);

function createBodyServerTests(uri: string, data: any) {
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
      },
    ],
  });
}
Scenarios.Encode_Duration_Property_Default = createBodyServerTests(
  "/encode/duration/property/default",
  {
    value: "P40D",
  },
);
Scenarios.Encode_Duration_Float_Seconds = createBodyServerTests(
  "/encode/duration/property/float-seconds",
  {
    value: 35.625,
  },
);
Scenarios.Encode_Duration_Float64_Seconds = createBodyServerTests(
  "/encode/duration/property/float64-seconds",
  {
    value: 35.625,
  },
);
Scenarios.Encode_Duration_Int32_Seconds = createBodyServerTests(
  "/encode/duration/property/int32-seconds",
  {
    value: 36,
  },
);
Scenarios.Encode_Duration_Iso8601 = createBodyServerTests("/encode/duration/property/iso8601", {
  value: "P40D",
});
Scenarios.Encode_Duration_Float_Seconds_Array = createBodyServerTests(
  "/encode/duration/property/float-seconds-array",
  {
    value: [35.625, 46.75],
  },
);

function createQueryServerTests(uri: string, paramData: any) {
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
      },
    ],
  });
}
Scenarios.Encode_Duration_Query_Default = createQueryServerTests("/encode/duration/query/default", {
  input: "P40D",
});
Scenarios.Encode_Duration_Query_Iso8601 = createQueryServerTests("/encode/duration/query/iso8601", {
  input: "P40D",
});
Scenarios.Encode_Duration_Query_Int32_Seconds = createQueryServerTests(
  "/encode/duration/query/int32-seconds",
  {
    input: 36,
  },
);
Scenarios.Encode_Duration_Query_Int32_Seconds_Array = createQueryServerTests(
  "/encode/duration/query/int32-seconds-array",
  {
    input: [36, 47].join(","),
  },
);
Scenarios.Encode_Duration_Query_Float_Seconds = createQueryServerTests(
  "/encode/duration/query/float-seconds",
  {
    input: 35.625,
  },
);
Scenarios.Encode_Duration_Query_Float64_Seconds = createQueryServerTests(
  "/encode/duration/query/float64-seconds",
  {
    input: 35.625,
  },
);

function createHeaderServerTests(uri: string, headersData: any) {
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
      },
    ],
  });
}

Scenarios.Encode_Duration_Header_Default = createHeaderServerTests(
  "/encode/duration/header/default",
  {
    duration: "P40D",
  },
);
Scenarios.Encode_Duration_Header_Iso8601 = createHeaderServerTests(
  "/encode/duration/header/iso8601",
  {
    duration: "P40D",
  },
);
Scenarios.Encode_Duration_Header_Int32_Seconds = createHeaderServerTests(
  "/encode/duration/header/int32-seconds",
  {
    duration: 36,
  },
);
Scenarios.Encode_Duration_Header_Float_Seconds = createHeaderServerTests(
  "/encode/duration/header/float-seconds",
  {
    duration: 35.625,
  },
);
Scenarios.Encode_Duration_Header_Float64_Seconds = createHeaderServerTests(
  "/encode/duration/header/float64-seconds",
  {
    duration: 35.625,
  },
);
Scenarios.Encode_Duration_Header_Iso8601_Array = createHeaderServerTests(
  "/encode/duration/header/iso8601-array",
  {
    duration: ["P40D", "P50D"].join(","),
  },
);
