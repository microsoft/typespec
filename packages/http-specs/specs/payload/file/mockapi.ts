import { passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";
import { pngFile } from "../../helper.js";

export const Scenarios: Record<string, ScenarioMockApi> = {};

const BASIC_FILE_CONTENT = Buffer.from("Test file content");

// Upload scenarios
Scenarios.Payload_File_Upload_basic = passOnSuccess({
  uri: "/payload/file/upload/basic",
  method: "post",
  request: {
    body: {
      rawContent: BASIC_FILE_CONTENT,
      contentType: "application/octet-stream",
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
      rawContent: pngFile,
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

Scenarios.Payload_File_Upload_custom = passOnSuccess({
  uri: "/payload/file/upload/custom",
  method: "post",
  request: {
    body: {
      rawContent: BASIC_FILE_CONTENT,
      contentType: "application/octet-stream",
    },
    headers: {
      "Content-Type": "application/octet-stream",
      "x-file-name": "custom-file.txt",
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
  request: {
    headers: {
      accept: "application/octet-stream",
    },
  },
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
  request: {
    headers: {
      accept: "image/png",
    },
  },
  response: {
    status: 200,
    body: {
      rawContent: pngFile,
      contentType: "image/png",
    },
  },
  kind: "MockApiDefinition",
});

Scenarios.Payload_File_Download_custom = passOnSuccess({
  uri: "/payload/file/download/custom",
  method: "get",
  request: {},
  response: {
    status: 200,
    body: {
      rawContent: BASIC_FILE_CONTENT,
      contentType: "application/octet-stream",
    },
    headers: {
      "x-file-name": "custom-file.txt",
    },
  },
  kind: "MockApiDefinition",
});
