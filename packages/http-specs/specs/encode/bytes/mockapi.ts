import { resolvePath } from "@typespec/compiler";
import {
  CollectionFormat,
  json,
  MockRequest,
  passOnSuccess,
  ScenarioMockApi,
} from "@typespec/spec-api";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";

const root = resolvePath(fileURLToPath(import.meta.url), "../../../../../");

const pngFile = readFileSync(resolvePath(root, "assets/image.png"));

export const Scenarios: Record<string, ScenarioMockApi> = {};

function createQueryServerTests(
  uri: string,
  data: any,
  value: any,
  collectionFormat?: CollectionFormat,
) {
  return passOnSuccess({
    uri,
    method: "get",
    request: {
      query: data,
    },
    response: {
      status: 204,
    },
    handler: (req: MockRequest) => {
      req.expect.containsQueryParam("value", value, collectionFormat);
      return {
        status: 204,
      };
    },
    kind: "MockApiDefinition",
  });
}
Scenarios.Encode_Bytes_Query_default = createQueryServerTests(
  "/encode/bytes/query/default",
  {
    value: "dGVzdA==",
  },
  "dGVzdA==",
);
Scenarios.Encode_Bytes_Query_base64 = createQueryServerTests(
  "/encode/bytes/query/base64",
  {
    value: "dGVzdA==",
  },
  "dGVzdA==",
);
Scenarios.Encode_Bytes_Query_base64url = createQueryServerTests(
  "/encode/bytes/query/base64url",
  {
    value: "dGVzdA",
  },
  "dGVzdA",
);
Scenarios.Encode_Bytes_Query_base64urlArray = createQueryServerTests(
  "/encode/bytes/query/base64url-array",
  {
    value: ["dGVzdA", "dGVzdA"].join(","),
  },
  ["dGVzdA", "dGVzdA"],
  "csv",
);
function createPropertyServerTests(uri: string, data: any, value: any) {
  return passOnSuccess({
    uri,
    method: "post",
    request: {
      body: json(data),
    },
    response: {
      status: 200,
      body: json({ value: value }),
    },
    kind: "MockApiDefinition",
  });
}
Scenarios.Encode_Bytes_Property_default = createPropertyServerTests(
  "/encode/bytes/property/default",
  {
    value: "dGVzdA==",
  },
  "dGVzdA==",
);
Scenarios.Encode_Bytes_Property_base64 = createPropertyServerTests(
  "/encode/bytes/property/base64",
  {
    value: "dGVzdA==",
  },
  "dGVzdA==",
);
Scenarios.Encode_Bytes_Property_base64url = createPropertyServerTests(
  "/encode/bytes/property/base64url",
  {
    value: "dGVzdA",
  },
  "dGVzdA",
);
Scenarios.Encode_Bytes_Property_base64urlArray = createPropertyServerTests(
  "/encode/bytes/property/base64url-array",
  {
    value: ["dGVzdA", "dGVzdA"],
  },
  ["dGVzdA", "dGVzdA"],
);
function createHeaderServerTests(uri: string, data: any, value: any) {
  return passOnSuccess({
    uri,
    method: "get",
    request: {
      headers: data,
    },
    response: {
      status: 204,
    },
    kind: "MockApiDefinition",
  });
}
Scenarios.Encode_Bytes_Header_default = createHeaderServerTests(
  "/encode/bytes/header/default",
  {
    value: "dGVzdA==",
  },
  "dGVzdA==",
);
Scenarios.Encode_Bytes_Header_base64 = createHeaderServerTests(
  "/encode/bytes/header/base64",
  {
    value: "dGVzdA==",
  },
  "dGVzdA==",
);
Scenarios.Encode_Bytes_Header_base64url = createHeaderServerTests(
  "/encode/bytes/header/base64url",
  {
    value: "dGVzdA",
  },
  "dGVzdA",
);
Scenarios.Encode_Bytes_Header_base64urlArray = createHeaderServerTests(
  "/encode/bytes/header/base64url-array",
  {
    value: ["dGVzdA", "dGVzdA"].join(","),
  },
  ["dGVzdA", "dGVzdA"].join(","),
);
function createRequestBodyServerTests(
  uri: string,
  data: any,
  contentType: string = "application/json",
) {
  return passOnSuccess({
    uri,
    method: "post",
    request: {
      body: {
        contentType: contentType,
        rawContent: data,
      },
    },
    response: {
      status: 204,
    },
    handler(req: MockRequest) {
      req.expect.containsHeader("content-type", contentType);
      req.expect.rawBodyEquals(data);
      return {
        status: 204,
      };
    },
    kind: "MockApiDefinition",
  });
}
Scenarios.Encode_Bytes_RequestBody_default = createRequestBodyServerTests(
  "/encode/bytes/body/request/default",
  pngFile,
  "application/octet-stream",
);
Scenarios.Encode_Bytes_RequestBody_base64 = createRequestBodyServerTests(
  "/encode/bytes/body/request/base64",
  '"dGVzdA=="',
);
Scenarios.Encode_Bytes_RequestBody_base64url = createRequestBodyServerTests(
  "/encode/bytes/body/request/base64url",
  '"dGVzdA"',
);

Scenarios.Encode_Bytes_RequestBody_customContentType = createRequestBodyServerTests(
  "/encode/bytes/body/request/custom-content-type",
  pngFile,
  "image/png",
);
Scenarios.Encode_Bytes_RequestBody_octetStream = createRequestBodyServerTests(
  "/encode/bytes/body/request/octet-stream",
  pngFile,
  "application/octet-stream",
);
function createResponseBodyServerTests(
  uri: string,
  data: any,
  headerData: any,
  value: any,
  contentType: string = "application/json",
) {
  return passOnSuccess({
    uri,
    method: "get",
    request: {
      headers: headerData,
    },
    response: {
      status: 200,
      body: {
        contentType: contentType,
        rawContent: data,
      },
    },
    handler(req: MockRequest) {
      return {
        status: 200,
        body: {
          contentType: contentType,
          rawContent: value,
        },
      };
    },
    kind: "MockApiDefinition",
  });
}
Scenarios.Encode_Bytes_ResponseBody_default = createResponseBodyServerTests(
  "/encode/bytes/body/response/default",
  pngFile,
  {
    "Content-Type": "application/octet-stream",
  },
  pngFile,
  "application/octet-stream",
);
Scenarios.Encode_Bytes_ResponseBody_base64 = createResponseBodyServerTests(
  "/encode/bytes/body/response/base64",
  JSON.stringify("dGVzdA=="),
  {
    "Content-Type": "application/json",
  },
  JSON.stringify("dGVzdA=="),
);
Scenarios.Encode_Bytes_ResponseBody_base64url = createResponseBodyServerTests(
  "/encode/bytes/body/response/base64url",
  JSON.stringify("dGVzdA"),
  {
    "Content-Type": "application/json",
  },
  JSON.stringify("dGVzdA"),
);
Scenarios.Encode_Bytes_ResponseBody_customContentType = createResponseBodyServerTests(
  "/encode/bytes/body/response/custom-content-type",
  pngFile,
  {
    "Content-Type": "image/png",
  },
  pngFile,
  "image/png",
);
Scenarios.Encode_Bytes_ResponseBody_octetStream = createResponseBodyServerTests(
  "/encode/bytes/body/response/octet-stream",
  pngFile,
  {
    "Content-Type": "application/octet-stream",
  },
  pngFile,
  "application/octet-stream",
);
