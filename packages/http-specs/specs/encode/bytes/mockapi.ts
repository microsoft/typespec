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
    mockMethods: [
      {
        method: "get",
        request: {
          config: {
            params: data,
          },
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
      },
    ],
  });
}
Scenarios.Encode_Bytes_Query_Default_Server_Test = createQueryServerTests(
  "/encode/bytes/query/default",
  {
    value: "dGVzdA==",
  },
  "dGVzdA==",
);
Scenarios.Encode_Bytes_Query_Base64_Server_Test = createQueryServerTests(
  "/encode/bytes/query/base64",
  {
    value: "dGVzdA==",
  },
  "dGVzdA==",
);
Scenarios.Encode_Bytes_Query_Base64_URL = createQueryServerTests(
  "/encode/bytes/query/base64url",
  {
    value: "dGVzdA",
  },
  "dGVzdA",
);
Scenarios.Encode_Bytes_Query_Base64_URL_Array = createQueryServerTests(
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
    mockMethods: [
      {
        method: "post",
        request: {
          body: data,
        },
        response: {
          status: 200,
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
Scenarios.Encode_Bytes_Property_Default_Server_Test = createPropertyServerTests(
  "/encode/bytes/property/default",
  {
    value: "dGVzdA==",
  },
  "dGVzdA==",
);
Scenarios.Encode_Bytes_Property_Base64_Server_Test = createPropertyServerTests(
  "/encode/bytes/property/base64",
  {
    value: "dGVzdA==",
  },
  "dGVzdA==",
);
Scenarios.Encode_Bytes_Property_Base64_URL = createPropertyServerTests(
  "/encode/bytes/property/base64url",
  {
    value: "dGVzdA",
  },
  "dGVzdA",
);
Scenarios.Encode_Bytes_Property_Base64_URL_Array = createPropertyServerTests(
  "/encode/bytes/property/base64url-array",
  {
    value: ["dGVzdA", "dGVzdA"],
  },
  ["dGVzdA", "dGVzdA"],
);
function createHeaderServerTests(uri: string, data: any, value: any) {
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
        handler: (req: MockRequest) => {
          req.expect.containsHeader("value", value);
          return {
            status: 204,
          };
        },
      },
    ],
  });
}
Scenarios.Encode_Bytes_Header_Default_Server_Test = createHeaderServerTests(
  "/encode/bytes/header/default",
  {
    value: "dGVzdA==",
  },
  "dGVzdA==",
);
Scenarios.Encode_Bytes_Header_Base64_Server_Test = createHeaderServerTests(
  "/encode/bytes/header/base64",
  {
    value: "dGVzdA==",
  },
  "dGVzdA==",
);
Scenarios.Encode_Bytes_Header_Base64_URL = createHeaderServerTests(
  "/encode/bytes/header/base64url",
  {
    value: "dGVzdA",
  },
  "dGVzdA",
);
Scenarios.Encode_Bytes_Header_Base64_URL_Array = createHeaderServerTests(
  "/encode/bytes/header/base64url-array",
  {
    value: ["dGVzdA", "dGVzdA"].join(","),
  },
  ["dGVzdA", "dGVzdA"].join(","),
);
function createRequestBodyServerTests(
  uri: string,
  data: any,
  headersData: any,
  value: any,
  contentType: string = "application/json",
) {
  return passOnSuccess({
    uri,
    mockMethods: [
      {
        method: "post",
        request: {
          body: data,
          config: {
            headers: headersData,
          },
        },
        response: {
          status: 204,
        },
        handler(req: MockRequest) {
          req.expect.containsHeader("content-type", contentType);
          req.expect.rawBodyEquals(value);
          return {
            status: 204,
          };
        },
      },
    ],
  });
}
Scenarios.Encode_Bytes_Body_Request_Default_Server_Test = createRequestBodyServerTests(
  "/encode/bytes/body/request/default",
  '"dGVzdA=="',
  {
    "Content-Type": "application/json",
  },
  '"dGVzdA=="',
);
Scenarios.Encode_Bytes_Body_Request_Base64 = createRequestBodyServerTests(
  "/encode/bytes/body/request/base64",
  '"dGVzdA=="',
  {
    "Content-Type": "application/json",
  },
  '"dGVzdA=="',
);
Scenarios.Encode_Bytes_Body_Request_Base64_URL = createRequestBodyServerTests(
  "/encode/bytes/body/request/base64url",
  '"dGVzdA=="',
  {
    "Content-Type": "application/json",
  },
  '"dGVzdA=="',
);

Scenarios.Encode_Bytes_Body_Request_Custom_Content_Type = createRequestBodyServerTests(
  "/encode/bytes/body/request/custom-content-type",
  pngFile,
  {
    "Content-Type": "image/png",
  },
  pngFile,
  "image/png",
);
Scenarios.Encode_Bytes_Body_Request_Octet_Stream = createRequestBodyServerTests(
  "/encode/bytes/body/request/octet-stream",
  pngFile,
  {
    "Content-Type": "application/octet-stream",
  },
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
    mockMethods: [
      {
        method: "get",
        request: {
          config: {
            headers: headerData,
          },
        },
        response: {
          status: 200,
          data: data,
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
      },
    ],
  });
}
Scenarios.Encode_Bytes_Body_Response_Default = createResponseBodyServerTests(
  "/encode/bytes/body/response/default",
  "dGVzdA==",
  {
    "Content-Type": "application/json",
  },
  "dGVzdA==",
);
Scenarios.Encode_Bytes_Body_Response_Base64 = createResponseBodyServerTests(
  "/encode/bytes/body/response/base64",
  "dGVzdA==",
  {
    "Content-Type": "application/json",
  },
  "dGVzdA==",
);
Scenarios.Encode_Bytes_Body_Response_Base64_URL = createResponseBodyServerTests(
  "/encode/bytes/body/response/base64url",
  "dGVzdA",
  {
    "Content-Type": "application/json",
  },
  "dGVzdA",
);
Scenarios.Encode_Bytes_Body_Response_Custom_Content_Type = createResponseBodyServerTests(
  "/encode/bytes/body/response/custom-content-type",
  pngFile,
  {
    "Content-Type": "image/png",
  },
  pngFile,
  "image/png",
);
Scenarios.Encode_Bytes_Body_Response_Octet_Stream = createResponseBodyServerTests(
  "/encode/bytes/body/response/octet-stream",
  pngFile,
  {
    "Content-Type": "application/octet-stream",
  },
  pngFile,
  "application/octet-stream",
);
