import {
  passOnSuccess,
  mockapi,
  json,
  CollectionFormat,
  MockApi,
  validateValueFormat,
  ValidationError,
} from "@typespec/spec-api";
import { ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

function createQueryMockApis(
  route: string,
  format: "rfc7231" | "rfc3339" | undefined,
  value: any,
  collectionFormat?: CollectionFormat,
): MockApi {
  const url = `/encode/datetime/query/${route}`;
  return mockapi.get(url, (req) => {
    if (format) {
      validateValueFormat(req.query["value"] as string, format);
      if (Date.parse(req.query["value"] as string) !== Date.parse(value)) {
        throw new ValidationError(`Wrong value`, value, req.query["value"]);
      }
    } else {
      req.expect.containsQueryParam("value", value, collectionFormat);
    }
    return {
      status: 204,
    };
  });
}

function createPropertyMockApis(route: string, format: "rfc7231" | "rfc3339" | undefined, value: any): MockApi {
  const url = `/encode/datetime/property/${route}`;
  return mockapi.post(url, (req) => {
    if (format) {
      validateValueFormat(req.body["value"], format);
      if (Date.parse(req.body["value"]) !== Date.parse(value)) {
        throw new ValidationError(`Wrong value`, value, req.body["value"]);
      }
    } else {
      req.expect.coercedBodyEquals({ value: value });
    }
    return {
      status: 200,
      body: json({ value: value }),
    };
  });
}

function createHeaderMockApis(route: string, format: "rfc7231" | "rfc3339" | undefined, value: any): MockApi {
  const url = `/encode/datetime/header/${route}`;
  return mockapi.get(url, (req) => {
    if (format) {
      validateValueFormat(req.headers["value"], format);
      if (Date.parse(req.headers["value"]) !== Date.parse(value)) {
        throw new ValidationError(`Wrong value`, value, req.headers["value"]);
      }
    } else {
      req.expect.containsHeader("value", value);
    }
    return {
      status: 204,
    };
  });
}

function createResponseHeaderMockApis(route: string, value: any): MockApi {
  const url = `/encode/datetime/responseheader/${route}`;
  return mockapi.get(url, () => {
    return {
      status: 204,
      headers: { value: value },
    };
  });
}

Scenarios.Encode_Datetime_Query_default = passOnSuccess(
  createQueryMockApis("default", "rfc3339", "2022-08-26T18:38:00.000Z"),
);
Scenarios.Encode_Datetime_Query_rfc3339 = passOnSuccess(
  createQueryMockApis("rfc3339", "rfc3339", "2022-08-26T18:38:00.000Z"),
);
Scenarios.Encode_Datetime_Query_rfc7231 = passOnSuccess(
  createQueryMockApis("rfc7231", "rfc7231", "Fri, 26 Aug 2022 14:38:00 GMT"),
);
Scenarios.Encode_Datetime_Query_unixTimestamp = passOnSuccess(
  createQueryMockApis("unix-timestamp", undefined, "1686566864"),
);
Scenarios.Encode_Datetime_Query_unixTimestampArray = passOnSuccess(
  createQueryMockApis("unix-timestamp-array", undefined, ["1686566864", "1686734256"], "csv"),
);

Scenarios.Encode_Datetime_Property_default = passOnSuccess(
  createPropertyMockApis("default", "rfc3339", "2022-08-26T18:38:00.000Z"),
);
Scenarios.Encode_Datetime_Property_rfc3339 = passOnSuccess(
  createPropertyMockApis("rfc3339", "rfc3339", "2022-08-26T18:38:00.000Z"),
);
Scenarios.Encode_Datetime_Property_rfc7231 = passOnSuccess(
  createPropertyMockApis("rfc7231", "rfc7231", "Fri, 26 Aug 2022 14:38:00 GMT"),
);
Scenarios.Encode_Datetime_Property_unixTimestamp = passOnSuccess(
  createPropertyMockApis("unix-timestamp", undefined, 1686566864),
);
Scenarios.Encode_Datetime_Property_unixTimestampArray = passOnSuccess(
  createPropertyMockApis("unix-timestamp-array", undefined, [1686566864, 1686734256]),
);

Scenarios.Encode_Datetime_Header_default = passOnSuccess(
  createHeaderMockApis("default", "rfc7231", "Fri, 26 Aug 2022 14:38:00 GMT"),
);
Scenarios.Encode_Datetime_Header_rfc3339 = passOnSuccess(
  createHeaderMockApis("rfc3339", "rfc3339", "2022-08-26T18:38:00.000Z"),
);
Scenarios.Encode_Datetime_Header_rfc7231 = passOnSuccess(
  createHeaderMockApis("rfc7231", "rfc7231", "Fri, 26 Aug 2022 14:38:00 GMT"),
);
Scenarios.Encode_Datetime_Header_unixTimestamp = passOnSuccess(
  createHeaderMockApis("unix-timestamp", undefined, "1686566864"),
);
Scenarios.Encode_Datetime_Header_unixTimestampArray = passOnSuccess(
  createHeaderMockApis("unix-timestamp-array", undefined, "1686566864,1686734256"),
);

Scenarios.Encode_Datetime_ResponseHeader_default = passOnSuccess(
  createResponseHeaderMockApis("default", "Fri, 26 Aug 2022 14:38:00 GMT"),
);
Scenarios.Encode_Datetime_ResponseHeader_rfc3339 = passOnSuccess(
  createResponseHeaderMockApis("rfc3339", "2022-08-26T18:38:00.000Z"),
);
Scenarios.Encode_Datetime_ResponseHeader_rfc7231 = passOnSuccess(
  createResponseHeaderMockApis("rfc7231", "Fri, 26 Aug 2022 14:38:00 GMT"),
);
Scenarios.Encode_Datetime_ResponseHeader_unixTimestamp = passOnSuccess(
  createResponseHeaderMockApis("unix-timestamp", 1686566864),
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
Scenarios.Encode_DateTime_Query_Default_Server_Test = createQueryServerTests("/encode/datetime/query/default", {
  value: "2022-08-26T18:38:00.000Z",
});
Scenarios.Encode_DateTime_Query_rfc3339_Server_Test = createQueryServerTests("/encode/datetime/query/rfc3339", {
  value: "2022-08-26T18:38:00.000Z",
});
Scenarios.Encode_DateTime_Query_rfc7231_Server_Test = createQueryServerTests("/encode/datetime/query/rfc7231", {
  value: "Fri, 26 Aug 2022 14:38:00 GMT",
});
Scenarios.Encode_DateTime_Query_Unix_Timestamp = createQueryServerTests("/encode/datetime/query/unix-timestamp", {
  value: 1686566864,
});
Scenarios.Encode_DateTime_Query_Unix_Timestamp_Array = createQueryServerTests(
  "/encode/datetime/query/unix-timestamp-array",
  {
    value: [1686566864, 1686734256].join(","),
  },
);
function createPropertyServerTests(uri: string, data: any) {
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
        },
      },
    ],
  });
}
Scenarios.Encode_DateTime_Property_Default_Server_Test = createPropertyServerTests(
  "/encode/datetime/property/default",
  {
    value: "2022-08-26T18:38:00.000Z",
  },
);
Scenarios.Encode_DateTime_Property_rfc3339_Server_Test = createPropertyServerTests(
  "/encode/datetime/property/rfc3339",
  {
    value: "2022-08-26T18:38:00.000Z",
  },
);
Scenarios.Encode_DateTime_Property_rfc7231_Server_Test = createPropertyServerTests(
  "/encode/datetime/property/rfc7231",
  {
    value: "Fri, 26 Aug 2022 14:38:00 GMT",
  },
);
Scenarios.Encode_DateTime_Property_Unix_Timestamp = createPropertyServerTests(
  "/encode/datetime/property/unix-timestamp",
  {
    value: 1686566864,
  },
);
Scenarios.Encode_DateTime_Property_Unix_Timestamp_Array = createPropertyServerTests(
  "/encode/datetime/property/unix-timestamp-array",
  {
    value: [1686566864, 1686734256],
  },
);
function createHeaderServerTests(uri: string, data: any) {
  return passOnSuccess({
    uri,
    mockMethods: [
      {
        method: "get",
        request: {
          config: {
            headers: data,
          },
        },
        response: {
          status: 204,
        },
      },
    ],
  });
}
Scenarios.Encode_DateTime_Header_Default_Server_Test = createHeaderServerTests("/encode/datetime/header/default", {
  value: "Fri, 26 Aug 2022 14:38:00 GMT",
});
Scenarios.Encode_DateTime_Header_rfc3339_Server_Test = createHeaderServerTests("/encode/datetime/header/rfc3339", {
  value: "2022-08-26T18:38:00.000Z",
});
Scenarios.Encode_DateTime_Header_rfc7231_Server_Test = createHeaderServerTests("/encode/datetime/header/rfc7231", {
  value: "Fri, 26 Aug 2022 14:38:00 GMT",
});
Scenarios.Encode_DateTime_Header_Unix_Timestamp = createHeaderServerTests("/encode/datetime/header/unix-timestamp", {
  value: 1686566864,
});
Scenarios.Encode_DateTime_Header_Unix_Timestamp_Array = createHeaderServerTests(
  "/encode/datetime/header/unix-timestamp-array",
  {
    value: [1686566864, 1686734256].join(","),
  },
);
function createResponseHeaderServerTests(uri: string, data: any) {
  return passOnSuccess({
    uri,
    mockMethods: [
      {
        method: "get",
        request: {},
        response: {
          status: 204,
          headers: data,
        },
      },
    ],
  });
}
Scenarios.Encode_DateTime_ResponseHeader_Default_Server_Test = createResponseHeaderServerTests(
  "/encode/datetime/responseheader/default",
  {
    value: "Fri, 26 Aug 2022 14:38:00 GMT",
  },
);
Scenarios.Encode_DateTime_ResponseHeader_rfc3339_Server_Test = createResponseHeaderServerTests(
  "/encode/datetime/responseheader/rfc3339",
  {
    value: "2022-08-26T18:38:00.000Z",
  },
);
Scenarios.Encode_DateTime_ResponseHeader_rfc7231_Server_Test = createResponseHeaderServerTests(
  "/encode/datetime/responseheader/rfc7231",
  {
    value: "Fri, 26 Aug 2022 14:38:00 GMT",
  },
);
Scenarios.Encode_DateTime_ResponseHeader_Unix_Timestamp = createResponseHeaderServerTests(
  "/encode/datetime/responseheader/unix-timestamp",
  {
    value: "1686566864",
  },
);
