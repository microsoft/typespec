import { passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

const BASIC_FILE_CONTENT = Buffer.from("Test file content");
const PNG_FILE_CONTENT = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64",
);

// Upload scenarios
Scenarios.Payload_File_Upload_basic = passOnSuccess({
  uri: "/payload/file/upload/basic",
  method: "post",
  request: {
    body: {
      rawContent: BASIC_FILE_CONTENT,
      contentType: "application/octet-stream",
    },
    headers: {
      "Content-Type": "application/octet-stream",
    },
  },
  response: {
    status: 200,
  },
  kind: "MockApiDefinition",
});

Scenarios.Payload_File_Upload_png = passOnSuccess({
  uri: "/payload/file/upload/png",
  method: "post",
  request: {
    body: {
      rawContent: PNG_FILE_CONTENT,
      contentType: "image/png",
    },
    headers: {
      "Content-Type": "image/png",
    },
  },
  response: {
    status: 200,
  },
  kind: "MockApiDefinition",
});

// Download scenarios
Scenarios.Payload_File_Download_basic = passOnSuccess({
  uri: "/payload/file/download/basic",
  method: "get",
  request: {},
  response: {
    status: 200,
    body: {
      rawContent: BASIC_FILE_CONTENT,
      contentType: "application/octet-stream",
    },
  },
  kind: "MockApiDefinition",
});

Scenarios.Payload_File_Download_png = passOnSuccess({
  uri: "/payload/file/download/png",
  method: "get",
  request: {},
  response: {
    status: 200,
    body: {
      rawContent: PNG_FILE_CONTENT,
      contentType: "image/png",
    },
  },
  kind: "MockApiDefinition",
});
