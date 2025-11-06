import { json, passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

Scenarios.Payload_MediaType_StringBody_sendAsText = passOnSuccess({
  uri: "/payload/media-type/string-body/sendAsText",
  method: "post",
  request: {
    body: json("{cat}"),
    headers: {
      "Content-Type": "text/plain",
    },
  },
  response: {
    status: 200,
  },
  kind: "MockApiDefinition",
});

Scenarios.Payload_MediaType_StringBody_getAsText = passOnSuccess({
  uri: "/payload/media-type/string-body/getAsText",
  method: "get",
  request: {
    headers: {
      accept: "text/plain",
    },
  },
  response: {
    status: 200,
    body: { rawContent: "{cat}", contentType: "text/plain" },
  },
  kind: "MockApiDefinition",
});

Scenarios.Payload_MediaType_StringBody_sendAsJson = passOnSuccess({
  uri: "/payload/media-type/string-body/sendAsJson",
  method: "post",
  request: {
    body: json("foo"),
    headers: {
      "Content-Type": "application/json",
    },
  },
  response: {
    status: 200,
  },
  kind: "MockApiDefinition",
});

Scenarios.Payload_MediaType_StringBody_getAsJson = passOnSuccess({
  uri: "/payload/media-type/string-body/getAsJson",
  method: "get",
  request: {
    headers: {
      accept: "application/json",
    },
  },
  response: {
    status: 200,
    body: json("foo"),
  },
  kind: "MockApiDefinition",
});

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

Scenarios.Payload_MediaType_BinaryBody_sendAsCbor = passOnSuccess({
  uri: "/payload/media-type/binary-body/sendAsCbor",
  method: "post",
  request: {
    body: { rawContent: cborRequestData, contentType: "application/cbor" },
    headers: {
      "Content-Type": "application/cbor",
    },
  },
  response: {
    status: 200,
  },
  kind: "MockApiDefinition",
});

Scenarios.Payload_MediaType_BinaryBody_getAsCbor = passOnSuccess({
  uri: "/payload/media-type/binary-body/getAsCbor",
  method: "get",
  request: {
    headers: {
      accept: "application/cbor",
    },
  },
  response: {
    status: 200,
    body: { rawContent: cborResponseData, contentType: "application/cbor" },
    headers: {
      "content-type": "application/cbor",
    },
  },
  kind: "MockApiDefinition",
});

Scenarios.Payload_MediaType_BinaryBody_sendAsCose = passOnSuccess({
  uri: "/payload/media-type/binary-body/sendAsCose",
  method: "post",
  request: {
    body: { rawContent: coseData, contentType: "application/cose" },
    headers: {
      "Content-Type": "application/cose",
    },
  },
  response: {
    status: 200,
  },
  kind: "MockApiDefinition",
});

Scenarios.Payload_MediaType_BinaryBody_getAsCose = passOnSuccess({
  uri: "/payload/media-type/binary-body/getAsCose",
  method: "get",
  request: {
    headers: {
      accept: "application/cose",
    },
  },
  response: {
    status: 200,
    body: { rawContent: coseData, contentType: "application/cose" },
    headers: {
      "content-type": "application/cose",
    },
  },
  kind: "MockApiDefinition",
});

Scenarios.Payload_MediaType_BinaryBody_getWithLocationHeader = passOnSuccess({
  uri: "/payload/media-type/binary-body/getWithLocationHeader",
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

Scenarios.Payload_MediaType_BinaryBody_getPendingWithHeaders = passOnSuccess({
  uri: "/payload/media-type/binary-body/getPendingWithHeaders",
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

Scenarios.Payload_MediaType_BinaryBody_getErrorAsCbor = passOnSuccess({
  uri: "/payload/media-type/binary-body/getErrorAsCbor",
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
