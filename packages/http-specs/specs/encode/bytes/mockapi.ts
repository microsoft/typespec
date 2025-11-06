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

// CBOR test data: Represents {"key": "value"} in CBOR format
const cborRequestData = Buffer.from([
  0xa1, 0x63, 0x6b, 0x65, 0x79, 0x65, 0x76, 0x61, 0x6c, 0x75, 0x65,
]);

// CBOR test data: Represents {"status": "succeeded"} in CBOR format
const cborResponseData = Buffer.from([
  0xa1, 0x66, 0x73, 0x74, 0x61, 0x74, 0x75, 0x73, 0x69, 0x73, 0x75, 0x63, 0x63, 0x65, 0x65, 0x64,
  0x65, 0x64,
]);

// COSE Sign1 test data: Simplified COSE structure with signature
const coseData = Buffer.from([
  0xd2, 0x84, 0x43, 0xa1, 0x01, 0x26, 0xa0, 0x50, 0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x20, 0x57, 0x6f,
  0x72, 0x6c, 0x64, 0x21, 0x58, 0x40, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
]);

// CBOR operation status: Represents {"EntryID": "12345", "Status": "succeeded"}
const cborOperationStatus = Buffer.from([
  0xa2, 0x67, 0x45, 0x6e, 0x74, 0x72, 0x79, 0x49, 0x44, 0x65, 0x31, 0x32, 0x33, 0x34, 0x35, 0x66,
  0x53, 0x74, 0x61, 0x74, 0x75, 0x73, 0x69, 0x73, 0x75, 0x63, 0x63, 0x65, 0x65, 0x64, 0x65, 0x64,
]);

// CBOR pending response: Represents {"OperationID": "67890", "Status": "running"}
const cborPendingData = Buffer.from([
  0xa2, 0x6b, 0x4f, 0x70, 0x65, 0x72, 0x61, 0x74, 0x69, 0x6f, 0x6e, 0x49, 0x44, 0x65, 0x36, 0x37,
  0x38, 0x39, 0x30, 0x66, 0x53, 0x74, 0x61, 0x74, 0x75, 0x73, 0x67, 0x72, 0x75, 0x6e, 0x6e, 0x69,
  0x6e, 0x67,
]);

// CBOR problem details: Represents {-1: "Validation Error", -2: "Invalid request"}
const cborProblemDetails = Buffer.from([
  0xa2, 0x20, 0x70, 0x56, 0x61, 0x6c, 0x69, 0x64, 0x61, 0x74, 0x69, 0x6f, 0x6e, 0x20, 0x45, 0x72,
  0x72, 0x6f, 0x72, 0x21, 0x6f, 0x49, 0x6e, 0x76, 0x61, 0x6c, 0x69, 0x64, 0x20, 0x72, 0x65, 0x71,
  0x75, 0x65, 0x73, 0x74,
]);

Scenarios.Encode_Bytes_RequestBodyContentType_cbor = createRequestBodyServerTests(
  "/encode/bytes/body/request/cbor",
  cborRequestData,
  "application/cbor",
);

Scenarios.Encode_Bytes_RequestBodyContentType_cose = createRequestBodyServerTests(
  "/encode/bytes/body/request/cose",
  coseData,
  "application/cose",
);

Scenarios.Encode_Bytes_ResponseBodyContentType_cbor = createResponseBodyServerTests(
  "/encode/bytes/body/response/cbor",
  cborResponseData,
  {
    "Content-Type": "application/cbor",
  },
  cborResponseData,
  "application/cbor",
);

Scenarios.Encode_Bytes_ResponseBodyContentType_cose = createResponseBodyServerTests(
  "/encode/bytes/body/response/cose",
  coseData,
  {
    "Content-Type": "application/cose",
  },
  coseData,
  "application/cose",
);

Scenarios.Encode_Bytes_ResponseBodyContentType_cborWithLocation = passOnSuccess({
  uri: "/encode/bytes/body/response/cbor-with-location",
  method: "get",
  request: {
    headers: {
      accept: "application/cbor",
    },
  },
  response: {
    status: 200,
    body: { rawContent: cborOperationStatus, contentType: "application/cbor" },
    headers: {
      "content-type": "application/cbor",
      location: "/operations/12345",
    },
  },
  kind: "MockApiDefinition",
});

Scenarios.Encode_Bytes_ResponseBodyContentType_cborPending = passOnSuccess({
  uri: "/encode/bytes/body/response/cbor-pending",
  method: "get",
  request: {
    headers: {
      accept: "application/cbor",
    },
  },
  response: {
    status: 202,
    body: { rawContent: cborPendingData, contentType: "application/cbor" },
    headers: {
      "content-type": "application/cbor",
      location: "/operations/67890",
      "retry-after": "10",
    },
  },
  kind: "MockApiDefinition",
});

Scenarios.Encode_Bytes_ResponseBodyContentType_cborError = passOnSuccess({
  uri: "/encode/bytes/body/response/cbor-error",
  method: "get",
  request: {
    headers: {
      accept: "application/concise-problem-details+cbor",
    },
  },
  response: {
    status: 400,
    body: {
      rawContent: cborProblemDetails,
      contentType: "application/concise-problem-details+cbor",
    },
    headers: {
      "content-type": "application/concise-problem-details+cbor",
    },
  },
  kind: "MockApiDefinition",
});
