import {
  MockRequest,
  multipart,
  passOnSuccess,
  ScenarioMockApi,
  ValidationError,
  withServiceKeys,
} from "@typespec/spec-api";
import { jpgFile, pngFile } from "../../helper.js";

export const Scenarios: Record<string, ScenarioMockApi> = {};

function checkId(req: MockRequest) {
  req.expect.deepEqual(req.body.id, "123");
}

function checkAddress(req: MockRequest) {
  req.expect.deepEqual(JSON.parse(req.body.address), { city: "X" });
}

function checkPreviousAddresses(req: MockRequest) {
  req.expect.deepEqual(JSON.parse(req.body.previousAddresses), [{ city: "Y" }, { city: "Z" }]);
}

function checkFile(
  req: MockRequest,
  file: Record<string, any>,
  expected: Buffer,
  contentType: string = "application/octet-stream",
  fileName: string | undefined = undefined,
  mustCheckContentType: boolean = true,
) {
  // server depends on multer, which sets the mimetype to "text/plain" if this part has no content-type header
  if (mustCheckContentType || file.mimetype !== "text/plain") {
    req.expect.deepEqual(file.mimetype, contentType);
  }
  req.expect.deepEqual(file.buffer, expected);
  if (fileName) {
    req.expect.deepEqual(file.originalname, fileName);
  }
}

function checkJpgFile(
  req: MockRequest,
  file: Record<string, any>,
  contentType: string = "application/octet-stream",
  fileName: string | undefined = undefined,
  mustCheckContentType: boolean = true,
) {
  req.expect.deepEqual(file.fieldname, "profileImage");
  checkFile(req, file, jpgFile, contentType, fileName, mustCheckContentType);
}

function checkOptionalContentType(req: MockRequest) {
  if (req.files instanceof Array && req.files?.length > 0) {
    checkJpgFile(req, req.files[0], "application/octet-stream", undefined, false);
  } else {
    throw new ValidationError("No profileImage found", "jpg file is expected", req.body);
  }
}

function checkPngFile(req: MockRequest, file: Record<string, any>, fieldName: string = "pictures") {
  req.expect.deepEqual(file.fieldname, fieldName);
  checkFile(req, file, pngFile);
}

function checkProfileImage(req: MockRequest) {
  if (req.files instanceof Array && req.files?.length > 0) {
    checkJpgFile(req, req.files[0]);
  } else {
    throw new ValidationError("No profileImage found", "jpg file is expected", req.body);
  }
}

function checkFileNameAndContentType(req: MockRequest) {
  if (req.files instanceof Array && req.files?.length > 0) {
    checkJpgFile(req, req.files[0], "image/jpg", "hello.jpg");
  } else {
    throw new ValidationError("No profileImage found", "jpg file is expected", req.body);
  }
}

function checkAllFiles(req: MockRequest) {
  if (req.files instanceof Array && req.files?.length === 3) {
    for (const file of req.files) {
      if (file.fieldname === "profileImage") {
        checkJpgFile(req, file);
      } else if (file.fieldname === "pictures") {
        checkPngFile(req, file);
      } else {
        throw new ValidationError(
          "unexpected fieldname",
          "profileImage or pictures",
          file.fieldname,
        );
      }
    }
  } else {
    throw new ValidationError(
      "Can't parse files from request",
      "jpg/png files are expected",
      req.body,
    );
  }
}
function checkPictures(req: MockRequest) {
  if (req.files instanceof Array && req.files?.length === 2) {
    for (const file of req.files) {
      checkPngFile(req, file);
    }
  } else {
    throw new ValidationError("No pictures found", "png files are expected", req.body);
  }
}
function checkFloat(req: MockRequest) {
  req.expect.deepEqual(parseFloat(req.body.temperature), 0.5);
}
const files = [
  {
    fieldname: "profileImage",
    originalname: "image.jpg",
    buffer: jpgFile,
    mimetype: "application/octet-stream",
  },
  {
    fieldname: "pictures",
    originalname: "image.png",
    buffer: pngFile,
    mimetype: "application/octet-stream",
  },
];
function createHandler(req: MockRequest, checkList: ((req: MockRequest) => void)[]) {
  for (const callback of checkList) {
    callback(req);
  }
  return { status: 204 };
}

function createMultiBinaryPartsHandler(req: MockRequest) {
  if (req.files instanceof Array) {
    switch (req.files.length) {
      case 1:
        checkJpgFile(req, req.files[0]);
        return { pass: "profileImage", status: 204 } as const;
      case 2:
        let profileImage = false;
        let picture = false;
        for (const file of req.files) {
          if (file.fieldname === "profileImage") {
            checkJpgFile(req, file);
            profileImage = true;
          } else if (file.fieldname === "picture") {
            checkPngFile(req, file, "picture");
            picture = true;
          } else {
            throw new ValidationError(
              "unexpected fieldname",
              "profileImage or picture",
              file.fieldname,
            );
          }
        }
        if (!profileImage) {
          throw new ValidationError("No profileImage found", "jpg file is expected", req.body);
        } else if (!picture) {
          throw new ValidationError("No picture found", "png file are expected", req.body);
        }
        return { pass: "profileImage,picture", status: 204 } as const;
      default:
        throw new ValidationError(
          "number of files is incorrect",
          "1 or 2 files are expected",
          req.body,
        );
    }
  } else {
    throw new ValidationError(
      "Can't parse files from request",
      "jpg/png files are expected",
      req.body,
    );
  }
}

Scenarios.Payload_MultiPart_FormData_basic = passOnSuccess({
  uri: "/multipart/form-data/mixed-parts",
  method: "post",
  request: {
    body: multipart({ parts: { id: 123 }, files: [files[0]] }),
  },
  response: { status: 204 },
  handler: (req: MockRequest) => createHandler(req, [checkId, checkProfileImage]),
  kind: "MockApiDefinition",
});
Scenarios.Payload_MultiPart_FormData_fileArrayAndBasic = passOnSuccess({
  uri: "/multipart/form-data/complex-parts",
  method: "post",
  request: {
    body: multipart({
      parts: { id: 123, address: { city: "X" } },
      files: [files[0], files[1], files[1]],
    }),
  },
  response: { status: 204 },
  handler: (req: MockRequest) => createHandler(req, [checkId, checkAddress, checkAllFiles]),
  kind: "MockApiDefinition",
});
Scenarios.Payload_MultiPart_FormData_jsonPart = passOnSuccess({
  uri: "/multipart/form-data/json-part",
  method: "post",
  request: {
    body: multipart({ parts: { address: { city: "X" } }, files: [files[0]] }),
  },
  response: { status: 204 },
  handler: (req: MockRequest) => createHandler(req, [checkAddress, checkProfileImage]),
  kind: "MockApiDefinition",
});
Scenarios.Payload_MultiPart_FormData_binaryArrayParts = passOnSuccess({
  uri: "/multipart/form-data/binary-array-parts",
  method: "post",
  request: {
    body: multipart({ parts: { id: 123 }, files: [files[1], files[1]] }),
  },
  response: { status: 204 },
  handler: (req: MockRequest) => createHandler(req, [checkId, checkPictures]),
  kind: "MockApiDefinition",
});
Scenarios.Payload_MultiPart_FormData_multiBinaryParts = withServiceKeys([
  "profileImage",
  "profileImage,picture",
]).pass([
  {
    uri: "/multipart/form-data/multi-binary-parts",
    method: "post",
    request: {
      body: multipart({
        files: [files[0]],
      }),
    },
    response: { status: 204 },
    handler: createMultiBinaryPartsHandler,
    kind: "MockApiDefinition",
  },
  {
    uri: "/multipart/form-data/multi-binary-parts",
    method: "post",
    request: {
      body: multipart({
        files: [files[0], { ...files[1], fieldname: "picture" }],
      }),
    },
    response: { status: 204 },
    handler: createMultiBinaryPartsHandler,
    kind: "MockApiDefinition",
  },
]);
Scenarios.Payload_MultiPart_FormData_checkFileNameAndContentType = passOnSuccess({
  uri: "/multipart/form-data/check-filename-and-content-type",
  method: "post",
  request: {
    body: multipart({
      parts: { id: 123 },
      files: [{ ...files[0], mimetype: "image/jpg", originalname: "hello.jpg" }],
    }),
  },
  response: { status: 204 },
  handler: (req: MockRequest) => createHandler(req, [checkId, checkFileNameAndContentType]),
  kind: "MockApiDefinition",
});
Scenarios.Payload_MultiPart_FormData_anonymousModel = passOnSuccess({
  uri: "/multipart/form-data/anonymous-model",
  method: "post",
  request: {
    body: multipart({
      files: [files[0]],
    }),
  },
  response: { status: 204 },
  handler: (req: MockRequest) => createHandler(req, [checkProfileImage]),
  kind: "MockApiDefinition",
});
Scenarios.Payload_MultiPart_FormData_HttpParts_ContentType_imageJpegContentType = passOnSuccess({
  uri: "/multipart/form-data/check-filename-and-specific-content-type-with-httppart",
  method: "post",
  request: {
    body: multipart({
      files: [{ ...files[0], mimetype: "image/jpg", originalname: "hello.jpg" }],
    }),
  },
  response: { status: 204 },
  handler: (req: MockRequest) => createHandler(req, [checkFileNameAndContentType]),
  kind: "MockApiDefinition",
});
Scenarios.Payload_MultiPart_FormData_HttpParts_ContentType_requiredContentType = passOnSuccess({
  uri: "/multipart/form-data/check-filename-and-required-content-type-with-httppart",
  method: "post",
  request: {
    body: multipart({
      files: [files[0]],
    }),
  },
  response: { status: 204 },
  handler: (req: MockRequest) => createHandler(req, [checkProfileImage]),
  kind: "MockApiDefinition",
});
Scenarios.Payload_MultiPart_FormData_HttpParts_ContentType_optionalContentType = passOnSuccess({
  uri: "/multipart/form-data/file-with-http-part-optional-content-type",
  method: "post",
  request: {
    body: multipart({
      files: [files[0]],
    }),
  },
  response: { status: 204 },
  handler: (req: MockRequest) => createHandler(req, [checkOptionalContentType]),
  kind: "MockApiDefinition",
});
Scenarios.Payload_MultiPart_FormData_HttpParts_jsonArrayAndFileArray = passOnSuccess({
  uri: "/multipart/form-data/complex-parts-with-httppart",
  method: "post",
  request: {
    body: multipart({
      parts: {
        id: 123,
        address: { city: "X" },
        previousAddresses: [{ city: "Y" }, { city: "Z" }],
      },
      files: [files[0], files[1], files[1]],
    }),
  },
  response: { status: 204 },
  handler: (req: MockRequest) =>
    createHandler(req, [checkId, checkAddress, checkPreviousAddresses, checkAllFiles]),
  kind: "MockApiDefinition",
});
Scenarios.Payload_MultiPart_FormData_HttpParts_NonString_float = passOnSuccess({
  uri: "/multipart/form-data/non-string-float",
  method: "post",
  request: {
    body: multipart({
      parts: { temperature: 0.5 },
    }),
  },
  response: { status: 204 },
  handler: (req: MockRequest) => createHandler(req, [checkFloat]),
  kind: "MockApiDefinition",
});
