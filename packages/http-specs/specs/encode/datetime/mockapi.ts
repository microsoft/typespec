import {
  CollectionFormat,
  json,
  match,
  MockRequest,
  passOnSuccess,
  ScenarioMockApi,
} from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

function createQueryServerTests(
  uri: string,
  value: any,
  format: "rfc7231" | "rfc3339" | undefined,
  collectionFormat?: CollectionFormat,
) {
  if (format) {
    return passOnSuccess({
      uri,
      method: "get",
      request: {
        query: { value: match.dateTime[format](value) },
      },
      response: {
        status: 204,
      },
      kind: "MockApiDefinition",
    });
  }

  return passOnSuccess({
    uri,
    method: "get",
    request: {
      query: { value },
    },
    response: {
      status: 204,
    },
    handler(req: MockRequest) {
      req.expect.containsQueryParam("value", value, collectionFormat);
      return {
        status: 204,
      };
    },
    kind: "MockApiDefinition",
  });
}
Scenarios.Encode_Datetime_Query_default = createQueryServerTests(
  "/encode/datetime/query/default",
  "2022-08-26T18:38:00.000Z",
  "rfc3339",
);
Scenarios.Encode_Datetime_Query_rfc3339 = createQueryServerTests(
  "/encode/datetime/query/rfc3339",
  "2022-08-26T18:38:00.000Z",
  "rfc3339",
);
Scenarios.Encode_Datetime_Query_rfc7231 = createQueryServerTests(
  "/encode/datetime/query/rfc7231",
  "Fri, 26 Aug 2022 14:38:00 GMT",
  "rfc7231",
);
Scenarios.Encode_Datetime_Query_unixTimestamp = createQueryServerTests(
  "/encode/datetime/query/unix-timestamp",
  "1686566864",
  undefined,
);
Scenarios.Encode_Datetime_Query_unixTimestampArray = createQueryServerTests(
  "/encode/datetime/query/unix-timestamp-array",
  [1686566864, 1686734256].join(","),
  undefined,
  "csv",
);
function createPropertyServerTests(
  uri: string,
  value: any,
  format: "rfc7231" | "rfc3339" | undefined,
) {
  if (format) {
    const matcherBody = { value: match.dateTime[format](value) };
    return passOnSuccess({
      uri,
      method: "post",
      request: {
        body: json(matcherBody),
      },
      response: {
        status: 200,
        body: json(matcherBody),
      },
      kind: "MockApiDefinition",
    });
  }

  return passOnSuccess({
    uri,
    method: "post",
    request: {
      body: json({ value }),
    },
    response: {
      status: 200,
    },
    kind: "MockApiDefinition",
  });
}
Scenarios.Encode_Datetime_Property_default = createPropertyServerTests(
  "/encode/datetime/property/default",
  "2022-08-26T18:38:00.000Z",
  "rfc3339",
);
Scenarios.Encode_Datetime_Property_rfc3339 = createPropertyServerTests(
  "/encode/datetime/property/rfc3339",
  "2022-08-26T18:38:00.000Z",
  "rfc3339",
);
Scenarios.Encode_Datetime_Property_rfc7231 = createPropertyServerTests(
  "/encode/datetime/property/rfc7231",
  "Fri, 26 Aug 2022 14:38:00 GMT",
  "rfc7231",
);
Scenarios.Encode_Datetime_Property_unixTimestamp = createPropertyServerTests(
  "/encode/datetime/property/unix-timestamp",
  1686566864,
  undefined,
);
Scenarios.Encode_Datetime_Property_unixTimestampArray = createPropertyServerTests(
  "/encode/datetime/property/unix-timestamp-array",
  [1686566864, 1686734256],
  undefined,
);
function createHeaderServerTests(
  uri: string,
  value: any,
  format: "rfc7231" | "rfc3339" | undefined,
) {
  if (format) {
    return passOnSuccess({
      uri,
      method: "get",
      request: {
        headers: { value: match.dateTime[format](value) },
      },
      response: {
        status: 204,
      },
      kind: "MockApiDefinition",
    });
  }

  return passOnSuccess({
    uri,
    method: "get",
    request: {
      headers: { value },
    },
    response: {
      status: 204,
    },
    handler(req: MockRequest) {
      req.expect.containsHeader("value", String(value));
      return {
        status: 204,
      };
    },
    kind: "MockApiDefinition",
  });
}
Scenarios.Encode_Datetime_Header_default = createHeaderServerTests(
  "/encode/datetime/header/default",
  "Fri, 26 Aug 2022 14:38:00 GMT",
  "rfc7231",
);
Scenarios.Encode_Datetime_Header_rfc3339 = createHeaderServerTests(
  "/encode/datetime/header/rfc3339",
  "2022-08-26T18:38:00.000Z",
  "rfc3339",
);
Scenarios.Encode_Datetime_Header_rfc7231 = createHeaderServerTests(
  "/encode/datetime/header/rfc7231",
  "Fri, 26 Aug 2022 14:38:00 GMT",
  "rfc7231",
);
Scenarios.Encode_Datetime_Header_unixTimestamp = createHeaderServerTests(
  "/encode/datetime/header/unix-timestamp",
  1686566864,
  undefined,
);
Scenarios.Encode_Datetime_Header_unixTimestampArray = createHeaderServerTests(
  "/encode/datetime/header/unix-timestamp-array",
  [1686566864, 1686734256].join(","),
  undefined,
);
function createResponseHeaderServerTests(uri: string, value: any) {
  return passOnSuccess({
    uri,
    method: "get",
    request: {},
    response: {
      status: 204,
      headers: { value },
    },
    handler: (req: MockRequest) => {
      return {
        status: 204,
        headers: { value },
      };
    },
    kind: "MockApiDefinition",
  });
}
Scenarios.Encode_Datetime_ResponseHeader_default = createResponseHeaderServerTests(
  "/encode/datetime/responseheader/default",
  "Fri, 26 Aug 2022 14:38:00 GMT",
);
Scenarios.Encode_Datetime_ResponseHeader_rfc3339 = createResponseHeaderServerTests(
  "/encode/datetime/responseheader/rfc3339",
  "2022-08-26T18:38:00.000Z",
);
Scenarios.Encode_Datetime_ResponseHeader_rfc7231 = createResponseHeaderServerTests(
  "/encode/datetime/responseheader/rfc7231",
  "Fri, 26 Aug 2022 14:38:00 GMT",
);
Scenarios.Encode_Datetime_ResponseHeader_unixTimestamp = createResponseHeaderServerTests(
  "/encode/datetime/responseheader/unix-timestamp",
  "1686566864",
);
