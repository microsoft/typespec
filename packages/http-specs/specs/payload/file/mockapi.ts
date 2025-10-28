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

Scenarios.Payload_File_Upload_text = passOnSuccess({
  uri: "/payload/file/upload/text",
  method: "post",
  request: {
    body: {
      rawContent: "Text file value",
      contentType: "text/plain",
    },
    headers: {
      "Content-Type": "text/plain",
      "x-filename": "file.txt",
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

Scenarios.Payload_File_Download_text = passOnSuccess({
  uri: "/payload/file/download/text",
  method: "get",
  request: {},
  response: {
    status: 200,
    body: {
      rawContent: BASIC_FILE_CONTENT,
      contentType: "application/octet-stream",
    },
    headers: {
      "x-file-name": "file.txt",
    },
  },
  kind: "MockApiDefinition",
});
