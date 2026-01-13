import {
  CollectionFormat,
  json,
  MockRequest,
  passOnSuccess,
  ScenarioMockApi,
  validateValueFormat,
  ValidationError,
} from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

function createQueryServerTests(
  uri: string,
  paramData: any,
  format: "rfc7231" | "rfc3339" | undefined,
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
    handler(req: MockRequest) {
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
    },
    kind: "MockApiDefinition",
  });
}
Scenarios.Encode_Datetime_Query_default = createQueryServerTests(
  "/encode/datetime/query/default",
  {
    value: "2022-08-26T18:38:00.000Z",
  },
  "rfc3339",
  "2022-08-26T18:38:00.000Z",
);
Scenarios.Encode_Datetime_Query_rfc3339 = createQueryServerTests(
  "/encode/datetime/query/rfc3339",
  {
    value: "2022-08-26T18:38:00.000Z",
  },
  "rfc3339",
  "2022-08-26T18:38:00.000Z",
);
Scenarios.Encode_Datetime_Query_rfc7231 = createQueryServerTests(
  "/encode/datetime/query/rfc7231",
  {
    value: "Fri, 26 Aug 2022 14:38:00 GMT",
  },
  "rfc7231",
  "Fri, 26 Aug 2022 14:38:00 GMT",
);
Scenarios.Encode_Datetime_Query_unixTimestamp = createQueryServerTests(
  "/encode/datetime/query/unix-timestamp",
  {
    value: 1686566864,
  },
  undefined,
  "1686566864",
);
Scenarios.Encode_Datetime_Query_unixTimestampArray = createQueryServerTests(
  "/encode/datetime/query/unix-timestamp-array",
  {
    value: [1686566864, 1686734256].join(","),
  },
  undefined,
  ["1686566864", "1686734256"],
  "csv",
);
function createPropertyServerTests(
  uri: string,
  data: any,
  format: "rfc7231" | "rfc3339" | undefined,
  value: any,
) {
  return passOnSuccess({
    uri,
    method: "post",
    request: {
      body: json(data),
    },
    response: {
      status: 200,
    },
    handler: (req: MockRequest) => {
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
    },
    kind: "MockApiDefinition",
  });
}
Scenarios.Encode_Datetime_Property_default = createPropertyServerTests(
  "/encode/datetime/property/default",
  {
    value: "2022-08-26T18:38:00.000Z",
  },
  "rfc3339",
  "2022-08-26T18:38:00.000Z",
);
Scenarios.Encode_Datetime_Property_rfc3339 = createPropertyServerTests(
  "/encode/datetime/property/rfc3339",
  {
    value: "2022-08-26T18:38:00.000Z",
  },
  "rfc3339",
  "2022-08-26T18:38:00.000Z",
);
Scenarios.Encode_Datetime_Property_rfc7231 = createPropertyServerTests(
  "/encode/datetime/property/rfc7231",
  {
    value: "Fri, 26 Aug 2022 14:38:00 GMT",
  },
  "rfc7231",
  "Fri, 26 Aug 2022 14:38:00 GMT",
);
Scenarios.Encode_Datetime_Property_unixTimestamp = createPropertyServerTests(
  "/encode/datetime/property/unix-timestamp",
  {
    value: 1686566864,
  },
  undefined,
  1686566864,
);
Scenarios.Encode_Datetime_Property_unixTimestampArray = createPropertyServerTests(
  "/encode/datetime/property/unix-timestamp-array",
  {
    value: [1686566864, 1686734256],
  },
  undefined,
  [1686566864, 1686734256],
);
function createHeaderServerTests(
  uri: string,
  data: any,
  format: "rfc7231" | "rfc3339" | undefined,
  value: any,
) {
  return passOnSuccess({
    uri,
    method: "get",
    request: {
      headers: data,
    },
    response: {
      status: 204,
    },
    handler(req: MockRequest) {
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
    },
    kind: "MockApiDefinition",
  });
}
Scenarios.Encode_Datetime_Header_default = createHeaderServerTests(
  "/encode/datetime/header/default",
  {
    value: "Fri, 26 Aug 2022 14:38:00 GMT",
  },
  "rfc7231",
  "Fri, 26 Aug 2022 14:38:00 GMT",
);
Scenarios.Encode_Datetime_Header_rfc3339 = createHeaderServerTests(
  "/encode/datetime/header/rfc3339",
  {
    value: "2022-08-26T18:38:00.000Z",
  },
  "rfc3339",
  "2022-08-26T18:38:00.000Z",
);
Scenarios.Encode_Datetime_Header_rfc7231 = createHeaderServerTests(
  "/encode/datetime/header/rfc7231",
  {
    value: "Fri, 26 Aug 2022 14:38:00 GMT",
  },
  "rfc7231",
  "Fri, 26 Aug 2022 14:38:00 GMT",
);
Scenarios.Encode_Datetime_Header_unixTimestamp = createHeaderServerTests(
  "/encode/datetime/header/unix-timestamp",
  {
    value: 1686566864,
  },
  undefined,
  "1686566864",
);
Scenarios.Encode_Datetime_Header_unixTimestampArray = createHeaderServerTests(
  "/encode/datetime/header/unix-timestamp-array",
  {
    value: [1686566864, 1686734256].join(","),
  },
  undefined,
  "1686566864,1686734256",
);
function createResponseHeaderServerTests(uri: string, data: any, value: any) {
  return passOnSuccess({
    uri,
    method: "get",
    request: {},
    response: {
      status: 204,
      headers: data,
    },
    handler: (req: MockRequest) => {
      return {
        status: 204,
        headers: { value: value },
      };
    },
    kind: "MockApiDefinition",
  });
}
Scenarios.Encode_Datetime_ResponseHeader_default = createResponseHeaderServerTests(
  "/encode/datetime/responseheader/default",
  {
    value: "Fri, 26 Aug 2022 14:38:00 GMT",
  },
  "Fri, 26 Aug 2022 14:38:00 GMT",
);
Scenarios.Encode_Datetime_ResponseHeader_rfc3339 = createResponseHeaderServerTests(
  "/encode/datetime/responseheader/rfc3339",
  {
    value: "2022-08-26T18:38:00.000Z",
  },
  "2022-08-26T18:38:00.000Z",
);
Scenarios.Encode_Datetime_ResponseHeader_rfc7231 = createResponseHeaderServerTests(
  "/encode/datetime/responseheader/rfc7231",
  {
    value: "Fri, 26 Aug 2022 14:38:00 GMT",
  },
  "Fri, 26 Aug 2022 14:38:00 GMT",
);
Scenarios.Encode_Datetime_ResponseHeader_unixTimestamp = createResponseHeaderServerTests(
  "/encode/datetime/responseheader/unix-timestamp",
  {
    value: "1686566864",
  },
  1686566864,
);
