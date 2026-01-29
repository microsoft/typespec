import {
  MockRequest,
  passOnSuccess,
  ScenarioMockApi,
  ValidationError,
} from "@typespec/spec-api";
import { pngFile } from "../../helper.js";

export const Scenarios: Record<string, ScenarioMockApi> = {};

// Helper function to check file content
function checkFileContent(req: MockRequest, expectedFile: Buffer) {
  req.expect.rawBodyEquals(expectedFile);
}

// Helper function to check file in multipart
function checkMultipartFile(
  req: MockRequest,
  file: Record<string, any>,
  expectedContent: Buffer,
  expectedContentType: string,
  expectedFileName?: string,
) {
  req.expect.deepEqual(file.mimetype, expectedContentType);
  req.expect.deepEqual(file.buffer, expectedContent);
  if (expectedFileName) {
    req.expect.deepEqual(file.originalname, expectedFileName);
  }
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
      contentType: "application/octet-stream",
      rawContent: pngFile,
    },
  },
  response: {
    status: 204,
  },
  handler(req: MockRequest) {
    // Content-Type should be application/octet-stream or not specified
    const contentType = req.headers["content-type"];
    if (contentType && contentType !== "application/octet-stream") {
      throw new ValidationError(
        "Expected content-type to be application/octet-stream or not specified",
        "application/octet-stream",
        contentType,
      );
    }
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
      contentType: "application/octet-stream",
      rawContent: pngFile,
    },
  },
  handler(req: MockRequest) {
    return {
      status: 200,
      body: {
        contentType: "application/octet-stream",
        rawContent: pngFile,
      },
    };
  },
  kind: "MockApiDefinition",
});

// Multipart tests - Specific content type
Scenarios.Type_File_MultiPart_uploadFileSpecificContentType = passOnSuccess({
  uri: "/type/file/multipart/specific-content-type",
  method: "post",
  request: {
    headers: {
      "content-type": "multipart/form-data",
    },
  },
  response: {
    status: 204,
  },
  handler(req: MockRequest) {
    if (req.files instanceof Array && req.files.length === 1) {
      const file = req.files[0];
      req.expect.deepEqual(file.fieldname, "file");
      checkMultipartFile(req, file, pngFile, "image/png", "image.png");
      return { status: 204 };
    } else {
      throw new ValidationError("Expected exactly one file", "1 file", req.files);
    }
  },
  kind: "MockApiDefinition",
});

// Multipart tests - Multiple content types
Scenarios.Type_File_MultiPart_uploadFileMultipleContentTypes = passOnSuccess({
  uri: "/type/file/multipart/multiple-content-types",
  method: "post",
  request: {
    headers: {
      "content-type": "multipart/form-data",
    },
  },
  response: {
    status: 204,
  },
  handler(req: MockRequest) {
    if (req.files instanceof Array && req.files.length === 1) {
      const file = req.files[0];
      req.expect.deepEqual(file.fieldname, "file");
      // Client should send image/png (one of the allowed types)
      if (file.mimetype !== "image/png" && file.mimetype !== "image/jpeg") {
        throw new ValidationError(
          "Expected mimetype to be image/png or image/jpeg",
          "image/png or image/jpeg",
          file.mimetype,
        );
      }
      req.expect.deepEqual(file.buffer, pngFile);
      req.expect.deepEqual(file.originalname, "image.png");
      return { status: 204 };
    } else {
      throw new ValidationError("Expected exactly one file", "1 file", req.files);
    }
  },
  kind: "MockApiDefinition",
});

// Multipart tests - Required content type
Scenarios.Type_File_MultiPart_uploadFileRequiredContentType = passOnSuccess({
  uri: "/type/file/multipart/required-content-type",
  method: "post",
  request: {
    headers: {
      "content-type": "multipart/form-data",
    },
  },
  response: {
    status: 204,
  },
  handler(req: MockRequest) {
    if (req.files instanceof Array && req.files.length === 1) {
      const file = req.files[0];
      req.expect.deepEqual(file.fieldname, "file");
      checkMultipartFile(req, file, pngFile, "application/octet-stream", "image.png");
      return { status: 204 };
    } else {
      throw new ValidationError("Expected exactly one file", "1 file", req.files);
    }
  },
  kind: "MockApiDefinition",
});

// Multipart tests - File array
Scenarios.Type_File_MultiPart_uploadFileArray = passOnSuccess({
  uri: "/type/file/multipart/file-array",
  method: "post",
  request: {
    headers: {
      "content-type": "multipart/form-data",
    },
  },
  response: {
    status: 204,
  },
  handler(req: MockRequest) {
    if (req.files instanceof Array && req.files.length === 2) {
      for (const file of req.files) {
        req.expect.deepEqual(file.fieldname, "files");
        checkMultipartFile(req, file, pngFile, "image/png");
      }
      return { status: 204 };
    } else {
      throw new ValidationError("Expected exactly two files", "2 files", req.files);
    }
  },
  kind: "MockApiDefinition",
});
