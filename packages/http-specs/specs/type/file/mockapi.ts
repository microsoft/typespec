import { MockRequest, passOnSuccess, ScenarioMockApi, ValidationError } from "@typespec/spec-api";
import { pngFile } from "../../helper.js";

export const Scenarios: Record<string, ScenarioMockApi> = {};

// Helper function to check file content
function checkFileContent(req: MockRequest, expectedFile: Buffer) {
  req.expect.rawBodyEquals(expectedFile);
}

// Body tests - Request with specific content type
Scenarios.Type_File_Body_uploadFileSpecificContentType = passOnSuccess({
  uri: "/type/file/body/request/specific-content-type",
  method: "post",
  request: {
    body: {
      contentType: "image/png",
      rawContent: pngFile,
    },
  },
  response: {
    status: 204,
  },
  handler(req: MockRequest) {
    req.expect.containsHeader("content-type", "image/png");
    checkFileContent(req, pngFile);
    return { status: 204 };
  },
  kind: "MockApiDefinition",
});

// Body tests - Request with JSON content type
Scenarios.Type_File_Body_uploadFileJsonContentType = passOnSuccess({
  uri: "/type/file/body/request/json-content-type",
  method: "post",
  request: {
    body: {
      contentType: "application/json",
      rawContent: JSON.stringify({ message: "test file content" }),
    },
  },
  response: {
    status: 204,
  },
  handler(req: MockRequest) {
    req.expect.containsHeader("content-type", "application/json");
    req.expect.rawBodyEquals(JSON.stringify({ message: "test file content" }));
    return { status: 204 };
  },
  kind: "MockApiDefinition",
});

// Body tests - Response with JSON content type
Scenarios.Type_File_Body_downloadFileJsonContentType = passOnSuccess({
  uri: "/type/file/body/response/json-content-type",
  method: "get",
  request: {},
  response: {
    status: 200,
    body: {
      contentType: "application/json",
      rawContent: JSON.stringify({ message: "test file content" }),
    },
  },
  handler(req: MockRequest) {
    return {
      status: 200,
      body: {
        contentType: "application/json",
        rawContent: JSON.stringify({ message: "test file content" }),
      },
    };
  },
  kind: "MockApiDefinition",
});

// Body tests - Response with specific content type
Scenarios.Type_File_Body_downloadFileSpecificContentType = passOnSuccess({
  uri: "/type/file/body/response/specific-content-type",
  method: "get",
  request: {},
  response: {
    status: 200,
    body: {
      contentType: "image/png",
      rawContent: pngFile,
    },
  },
  handler(req: MockRequest) {
    return {
      status: 200,
      body: {
        contentType: "image/png",
        rawContent: pngFile,
      },
    };
  },
  kind: "MockApiDefinition",
});

// Body tests - Request with multiple content types
Scenarios.Type_File_Body_uploadFileMultipleContentTypes = passOnSuccess({
  uri: "/type/file/body/request/multiple-content-types",
  method: "post",
  request: {
    body: {
      contentType: "image/png",
      rawContent: pngFile,
    },
  },
  response: {
    status: 204,
  },
  handler(req: MockRequest) {
    // Client should send image/png (one of the allowed types)
    const contentType = req.headers["content-type"];
    if (contentType !== "image/png" && contentType !== "image/jpeg") {
      throw new ValidationError(
        "Expected content-type to be image/png or image/jpeg",
        "image/png or image/jpeg",
        contentType,
      );
    }
    checkFileContent(req, pngFile);
    return { status: 204 };
  },
  kind: "MockApiDefinition",
});

// Body tests - Response with multiple content types
Scenarios.Type_File_Body_downloadFileMultipleContentTypes = passOnSuccess({
  uri: "/type/file/body/response/multiple-content-types",
  method: "get",
  request: {},
  response: {
    status: 200,
    body: {
      contentType: "image/png",
      rawContent: pngFile,
    },
  },
  handler(req: MockRequest) {
    // Server returns image/png (one of the allowed types)
    return {
      status: 200,
      body: {
        contentType: "image/png",
        rawContent: pngFile,
      },
    };
  },
  kind: "MockApiDefinition",
});

// Body tests - Request with default content type
Scenarios.Type_File_Body_uploadFileDefaultContentType = passOnSuccess({
  uri: "/type/file/body/request/default-content-type",
  method: "post",
  request: {
    body: {
      contentType: "image/png",
      rawContent: pngFile,
    },
  },
  response: {
    status: 204,
  },
  handler(req: MockRequest) {
    // File type accepts any content type, but for testing we expect image/png
    req.expect.containsHeader("content-type", "image/png");
    checkFileContent(req, pngFile);
    return { status: 204 };
  },
  kind: "MockApiDefinition",
});

// Body tests - Response with default content type
Scenarios.Type_File_Body_downloadFileDefaultContentType = passOnSuccess({
  uri: "/type/file/body/response/default-content-type",
  method: "get",
  request: {},
  response: {
    status: 200,
    body: {
      contentType: "image/png",
      rawContent: pngFile,
    },
  },
  handler(req: MockRequest) {
    // File type accepts any content type, but for testing we return image/png
    return {
      status: 200,
      body: {
        contentType: "image/png",
        rawContent: pngFile,
      },
    };
  },
  kind: "MockApiDefinition",
});
