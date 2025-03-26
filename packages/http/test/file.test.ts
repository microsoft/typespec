import { expectDiagnosticEmpty, expectDiagnostics } from "@typespec/compiler/testing";
import { deepStrictEqual, ok, strictEqual } from "node:assert";
import { describe, expect, it } from "vitest";
import { isHeader } from "../src/decorators.js";
import { compileOperationsFull, getOperations } from "./test-host.js";

/*

CASES TO TEST

// `"single"` body: uploads file as a JSON structure { filename: <string>,
// contentType: <string>, contents: <base64> }
op uploadFileAsJson(@header contentType: "application/json", @body file: File)

// `"file"` body: Uploads file as a binary data stream. Content-Type has contentType and
// filename cannot be specified (Content-Disposition is a response-only header)
op uploadFile(@body file: File);
op uploadFile(...File);

// `"file"` body: Downloads file as binary data stream. Content-Type has contentType and
// filename comes from Content-Disposition
op downloadFile(): { @body file: File };
op downloadFile(): File;


// Declares a custom textual file that can either be "application/json" or "application/yaml"
model SpecFile extends File<Contents = bytes> {
  contentType: "application/json" | "application/yaml";
  // We can put HTTP metadata inside the file model as long as we use it with `@bodyRoot` and not
  // `@body`      
  @header("x-filename") filename: string;
}

// ??? with @header on contentType
op uploadWeird(@bodyRoot file: SpecFile): void;

// `"file"` body: Uploads spec as a file. Content-Type has contentType, x-filename has filename.
// isText: true
op uploadSpec(@bodyRoot spec: SpecFile): void;

// `"single"` body: Uploads spec as a JSON object { contentType: <json or yaml>,
// filename: <string>, contents: <string> }
op uploadSpec(@header contentType: "application/json", @body spec: SpecFile): void;

op uploadFileMultipart(@multipartBody fields: { file: HttpPart<SpecFile> }): void;

op uploadFileNested(@body data: { file: File }): void;

op uploadFileInPieces(
  @header contentType: "application/json" | "application/yaml",
  // filename?
  @body contents: bytes,
}: void;
*/

it("does not allow instances that improperly provide contents argument", async () => {
  const { diagnostics } = await compileOperationsFull(`
      model BadFile1 extends Http.File<Contents = string | bytes> {}

      model BadFile2 extends Http.File<Contents = "asdf"> {}
    `);

  expectDiagnostics(diagnostics, [
    {
      code: "@typespec/http/http-file-contents-not-scalar",
      severity: "error",
      message:
        "The 'contents' property of the file model must be a scalar type that extends 'string' or 'bytes'. Found 'string | bytes'.",
    },
    {
      code: "@typespec/http/http-file-contents-not-scalar",
      severity: "error",
      message:
        "The 'contents' property of the file model must be a scalar type that extends 'string' or 'bytes'. Found '\"asdf\"'.",
    },
  ]);
});

it("correctly attaches diagnostic to raw string argument", async () => {
  const { diagnostics } = await compileOperationsFull(`
      model BadFile1 extends Http.File<"application/json", "asdf"> {}
    `);

  expectDiagnostics(diagnostics, [
    {
      code: "@typespec/http/http-file-contents-not-scalar",
      severity: "error",
      message:
        "The 'contents' property of the file model must be a scalar type that extends 'string' or 'bytes'. Found '\"asdf\"'.",
    },
  ]);
});

it("allows contents that extend string", async () => {
  const {
    operations: [
      {
        parameters: { body: requestBody },
        responses: [
          {
            responses: [{ body: responseBody }],
          },
        ],
      },
    ],
    diagnostics,
  } = await compileOperationsFull(`
    scalar guid extends string;

    model GoodFile extends Http.File<Contents = guid> {}

    op uploadFile(@body file: GoodFile): GoodFile;
  `);

  expectDiagnosticEmpty(diagnostics);

  strictEqual(requestBody?.bodyKind, "file");
  ok(requestBody.property);
  strictEqual(requestBody.property.name, "file");
  deepStrictEqual(requestBody.contentTypes, ["*/*"]);
  strictEqual(requestBody.isText, true);

  strictEqual(responseBody?.bodyKind, "file");
  expect(responseBody.property).toStrictEqual(undefined);
  deepStrictEqual(responseBody?.contentTypes, ["*/*"]);
  strictEqual(responseBody?.isText, true);
});

it("allows contents that extend bytes", async () => {
  const {
    operations: [
      {
        parameters: { body: requestBody },
        responses: [
          {
            responses: [{ body: responseBody }],
          },
        ],
      },
    ],
    diagnostics,
  } = await compileOperationsFull(`
    scalar message extends bytes;

    model GoodFile extends Http.File<Contents = message> {}

    op uploadFile(@body file: GoodFile): GoodFile;
  `);

  expectDiagnosticEmpty(diagnostics);

  strictEqual(requestBody?.bodyKind, "file");
  ok(requestBody.property);
  strictEqual(requestBody.property.name, "file");
  deepStrictEqual(requestBody?.contentTypes, ["*/*"]);
  strictEqual(requestBody?.isText, false);

  strictEqual(responseBody?.bodyKind, "file");
  expect(responseBody?.property).toStrictEqual(undefined);
  deepStrictEqual(responseBody?.contentTypes, ["*/*"]);
  strictEqual(responseBody?.isText, false);
});

it("does not allow instances that improperly provide ContentType argument", async () => {
  const { diagnostics } = await compileOperationsFull(`
    scalar myString extends string;
    model BadFile1 extends Http.File<ContentType = myString> {}

    model BadFile2 extends Http.File<ContentType = "asdf" | string> {}
  `);

  expectDiagnostics(diagnostics, [
    {
      code: "@typespec/http/http-file-content-type-not-string",
      severity: "error",
      message:
        "The 'contentType' property of the file model must be 'TypeSpec.string', a string literal, or a union of string literals. Found 'TestService.myString'.",
    },
    {
      code: "@typespec/http/http-file-content-type-not-string",
      severity: "error",
      message:
        "The 'contentType' property of the file model must be 'TypeSpec.string', a string literal, or a union of string literals. Found '\"asdf\" | string'.",
    },
  ]);
});

it("exact payload upload and download", async () => {
  const [
    {
      parameters: { body: requestBody },
      responses: [
        {
          responses: [{ body: responseBody }],
        },
      ],
    },
  ] = await getOperations(`
      op example(...Http.File): Http.File;
    `);

  strictEqual(requestBody?.bodyKind, "file");
  expect(requestBody?.property).toStrictEqual(undefined);
  deepStrictEqual(requestBody?.contentTypes, ["*/*"]);

  strictEqual(responseBody?.bodyKind, "file");
  expect(responseBody?.property).toStrictEqual(undefined);
  deepStrictEqual(responseBody?.contentTypes, ["*/*"]);
});

it("intersect payload upload and download", async () => {
  const [
    {
      parameters: { parameters: requestParameters, body: requestBody },
      responses: [
        {
          responses: [{ body: responseBody }],
        },
      ],
    },
  ] = await getOperations(`
      op example(...Http.File, @header xFoo: string): Http.File & OkResponse;
    `);

  strictEqual(requestBody?.bodyKind, "file");
  expect(requestBody?.property).toStrictEqual(undefined);
  deepStrictEqual(requestBody?.contentTypes, ["*/*"]);
  const requestXFoo = requestParameters.find((p) => p.type === "header" && p.name === "x-foo");
  ok(requestXFoo);

  strictEqual(responseBody?.bodyKind, "file");
  expect(responseBody?.property).toStrictEqual(undefined);
  deepStrictEqual(responseBody?.contentTypes, ["*/*"]);
});

it("explicit bodyRoot upload and download", async () => {
  const [
    {
      parameters: { body: requestBody },
      responses: [
        {
          responses: [{ body: responseBody }],
        },
      ],
    },
  ] = await getOperations(`
      op example(@bodyRoot file: Http.File): { @bodyRoot file: Http.File };
    `);

  strictEqual(requestBody?.bodyKind, "file");
  ok(requestBody.property);
  strictEqual(requestBody.property.name, "file");
  deepStrictEqual(requestBody?.contentTypes, ["*/*"]);

  strictEqual(responseBody?.bodyKind, "file");
  ok(responseBody.property);
  strictEqual(responseBody.property.name, "file");
  deepStrictEqual(responseBody?.contentTypes, ["*/*"]);
});

it("explicit body upload and download", async () => {
  const [
    {
      parameters: { body: requestBody },
      responses: [
        {
          responses: [{ body: responseBody }],
        },
      ],
    },
  ] = await getOperations(`
      op example(@body file: Http.File): { @body file: Http.File };
    `);

  strictEqual(requestBody?.bodyKind, "file");
  ok(requestBody.property);
  strictEqual(requestBody.property.name, "file");
  deepStrictEqual(requestBody?.contentTypes, ["*/*"]);

  strictEqual(responseBody?.bodyKind, "file");
  ok(responseBody.property);
  strictEqual(responseBody.property.name, "file");
  deepStrictEqual(responseBody?.contentTypes, ["*/*"]);
});

describe("multipart", () => {
  it("exact payload form-data upload and download", async () => {
    const [
      {
        parameters: { body: multipartRequestBody },
        responses: [
          {
            responses: [{ body: multipartResponseBody }],
          },
        ],
      },
    ] = await getOperations(`
        op example(@multipartBody fields: { file: HttpPart<Http.File> }) : { @multipartBody fields: { file: HttpPart<Http.File>}};
      `);

    strictEqual(multipartRequestBody?.bodyKind, "multipart");
    ok(multipartRequestBody?.property);
    deepStrictEqual(multipartRequestBody?.contentTypes, ["multipart/form-data"]);
    strictEqual(multipartRequestBody?.parts.length, 1);
    const requestPartBody = multipartRequestBody?.parts[0].body;
    strictEqual(requestPartBody.bodyKind, "file");
    expect(requestPartBody.property).toStrictEqual(undefined);
    deepStrictEqual(requestPartBody.contentTypes, ["*/*"]);

    strictEqual(multipartResponseBody?.bodyKind, "multipart");
    ok(multipartResponseBody?.property);
    deepStrictEqual(multipartResponseBody?.contentTypes, ["multipart/form-data"]);
    strictEqual(multipartResponseBody?.parts.length, 1);
    const responsePartBody = multipartResponseBody?.parts[0].body;
    strictEqual(responsePartBody.bodyKind, "file");
    expect(responsePartBody.property).toStrictEqual(undefined);
    deepStrictEqual(responsePartBody.contentTypes, ["*/*"]);
  });

  it("intersected payload form-data upload and download", async () => {
    const [
      {
        parameters: { body: multipartRequestBody },
        responses: [
          {
            responses: [{ body: multipartResponseBody }],
          },
        ],
      },
    ] = await getOperations(`
        op example(@multipartBody fields: { file: HttpPart<Http.File & { @header xFoo: string }> }) : { @multipartBody fields: { file: HttpPart<Http.File & { @header xBar: string }>}};
      `);

    strictEqual(multipartRequestBody?.bodyKind, "multipart");
    ok(multipartRequestBody?.property);
    deepStrictEqual(multipartRequestBody?.contentTypes, ["multipart/form-data"]);
    strictEqual(multipartRequestBody?.parts.length, 1);
    const requestPartBody = multipartRequestBody?.parts[0].body;
    strictEqual(requestPartBody.bodyKind, "file");
    expect(requestPartBody.property).toStrictEqual(undefined);
    deepStrictEqual(requestPartBody.contentTypes, ["*/*"]);

    strictEqual(multipartResponseBody?.bodyKind, "multipart");
    ok(multipartResponseBody?.property);
    deepStrictEqual(multipartResponseBody?.contentTypes, ["multipart/form-data"]);
    strictEqual(multipartResponseBody?.parts.length, 1);
    const responsePartBody = multipartResponseBody?.parts[0].body;
    strictEqual(responsePartBody.bodyKind, "file");
    expect(responsePartBody.property).toStrictEqual(undefined);
    deepStrictEqual(responsePartBody.contentTypes, ["*/*"]);
  });

  it("exact payload form-data upload and download with spread", async () => {
    const [
      {
        parameters: { body: multipartRequestBody },
        responses: [
          {
            responses: [{ body: multipartResponseBody }],
          },
        ],
      },
    ] = await getOperations(`
        op example(@multipartBody fields: { file: HttpPart<{ ...Http.File }> }) : { @multipartBody fields: { file: HttpPart<{ ...Http.File }>}};
      `);

    strictEqual(multipartRequestBody?.bodyKind, "multipart");
    ok(multipartRequestBody?.property);
    deepStrictEqual(multipartRequestBody?.contentTypes, ["multipart/form-data"]);
    strictEqual(multipartRequestBody?.parts.length, 1);
    const requestPartBody = multipartRequestBody?.parts[0].body;
    strictEqual(requestPartBody.bodyKind, "file");
    expect(requestPartBody.property).toStrictEqual(undefined);
    deepStrictEqual(requestPartBody.contentTypes, ["*/*"]);

    strictEqual(multipartResponseBody?.bodyKind, "multipart");
    ok(multipartResponseBody?.property);
    deepStrictEqual(multipartResponseBody?.contentTypes, ["multipart/form-data"]);
    strictEqual(multipartResponseBody?.parts.length, 1);
    const responsePartBody = multipartResponseBody?.parts[0].body;
    strictEqual(responsePartBody.bodyKind, "file");
    expect(responsePartBody.property).toStrictEqual(undefined);
    deepStrictEqual(responsePartBody.contentTypes, ["*/*"]);
  });

  it("explicit bodyRoot form-data upload and download", async () => {
    const [
      {
        parameters: { body: multipartRequestBody },
        responses: [
          {
            responses: [{ body: multipartResponseBody }],
          },
        ],
      },
    ] = await getOperations(`
        op example(@multipartBody fields: { file: HttpPart<{ @bodyRoot file: Http.File }> }) : { @multipartBody fields: { file: HttpPart<{ @bodyRoot file: Http.File }>}};
      `);

    strictEqual(multipartRequestBody?.bodyKind, "multipart");
    ok(multipartRequestBody?.property);
    deepStrictEqual(multipartRequestBody?.contentTypes, ["multipart/form-data"]);
    strictEqual(multipartRequestBody?.parts.length, 1);
    const requestPartBody = multipartRequestBody?.parts[0].body;
    strictEqual(requestPartBody.bodyKind, "file");
    ok(requestPartBody.property);
    strictEqual(requestPartBody.property.name, "file");
    deepStrictEqual(requestPartBody.contentTypes, ["*/*"]);

    strictEqual(multipartResponseBody?.bodyKind, "multipart");
    ok(multipartResponseBody?.property);
    deepStrictEqual(multipartResponseBody?.contentTypes, ["multipart/form-data"]);
    strictEqual(multipartResponseBody?.parts.length, 1);
    const responsePartBody = multipartResponseBody?.parts[0].body;
    strictEqual(responsePartBody.bodyKind, "file");
    ok(responsePartBody.property);
    strictEqual(responsePartBody.property.name, "file");
    deepStrictEqual(responsePartBody.contentTypes, ["*/*"]);
  });

  it("explicit body payload form-data upload and download", async () => {
    const [
      {
        parameters: { body: multipartRequestBody },
        responses: [
          {
            responses: [{ body: multipartResponseBody }],
          },
        ],
      },
    ] = await getOperations(`
        op example(@multipartBody fields: { file: HttpPart<{ @body file: Http.File }> }) : { @multipartBody fields: { file: HttpPart<{ @body file: Http.File }>}};
      `);

    strictEqual(multipartRequestBody?.bodyKind, "multipart");
    ok(multipartRequestBody?.property);
    deepStrictEqual(multipartRequestBody?.contentTypes, ["multipart/form-data"]);
    strictEqual(multipartRequestBody?.parts.length, 1);
    const requestPartBody = multipartRequestBody?.parts[0].body;
    strictEqual(requestPartBody.bodyKind, "file");
    ok(requestPartBody.property);
    strictEqual(requestPartBody.property.name, "file");
    deepStrictEqual(requestPartBody.contentTypes, ["*/*"]);

    strictEqual(multipartResponseBody?.bodyKind, "multipart");
    ok(multipartResponseBody?.property);
    deepStrictEqual(multipartResponseBody?.contentTypes, ["multipart/form-data"]);
    strictEqual(multipartResponseBody?.parts.length, 1);
    const responsePartBody = multipartResponseBody?.parts[0].body;
    strictEqual(responsePartBody.bodyKind, "file");
    ok(responsePartBody.property);
    strictEqual(responsePartBody.property.name, "file");
    deepStrictEqual(responsePartBody.contentTypes, ["*/*"]);
  });
});

describe("custom file model", () => {
  function makeFileModel(filenameHeader?: string, contents: string = "string") {
    return `
        model SpecFile extends Http.File<Contents = ${contents}> {
          contentType: "application/json" | "application/yaml";
          ${filenameHeader ? `@header(${JSON.stringify(filenameHeader)}) ` : ""}filename: string;
        }
    `;
  }

  it("exact payload upload and download", async () => {
    const [
      {
        parameters: { body: requestBody },
        responses: [
          {
            responses: [{ body: responseBody }],
          },
        ],
      },
    ] = await getOperations(`
        ${makeFileModel()}
        op example(...SpecFile): SpecFile;
      `);

    strictEqual(requestBody?.bodyKind, "file");
    expect(requestBody?.property).toStrictEqual(undefined);
    deepStrictEqual(requestBody?.contentTypes, ["application/json", "application/yaml"]);
    ok(requestBody?.isText);

    strictEqual(responseBody?.bodyKind, "file");
    expect(responseBody?.property).toStrictEqual(undefined);
    deepStrictEqual(responseBody?.contentTypes, ["application/json", "application/yaml"]);
    ok(responseBody?.isText);
  });

  it("intersected payload upload and download", async () => {
    const [
      {
        parameters: { parameters: requestParameters, body: requestBody },
        responses: [
          {
            responses: [{ body: responseBody }],
          },
        ],
      },
    ] = await getOperations(`
        ${makeFileModel()}
        op example(...SpecFile, @header xFoo: string): SpecFile &  OkResponse;
      `);

    strictEqual(requestBody?.bodyKind, "file");
    expect(requestBody?.property).toStrictEqual(undefined);
    deepStrictEqual(requestBody?.contentTypes, ["application/json", "application/yaml"]);
    ok(requestBody?.isText);
    const requestXFoo = requestParameters.find((p) => p.type === "header" && p.name === "x-foo");
    ok(requestXFoo);

    strictEqual(responseBody?.bodyKind, "file");
    expect(responseBody?.property).toStrictEqual(undefined);
    deepStrictEqual(responseBody?.contentTypes, ["application/json", "application/yaml"]);
    ok(responseBody?.isText);
  });

  it("explicit body upload and download", async () => {
    const [
      {
        parameters: { body: requestBody },
        responses: [
          {
            responses: [{ body: responseBody }],
          },
        ],
      },
    ] = await getOperations(`
        ${makeFileModel()}
        op example(@body file: SpecFile): { @body file: SpecFile };
      `);

    strictEqual(requestBody?.bodyKind, "file");
    ok(requestBody.property);
    strictEqual(requestBody.property.name, "file");
    deepStrictEqual(requestBody.contentTypes, ["application/json", "application/yaml"]);
    ok(requestBody.isText);

    strictEqual(responseBody?.bodyKind, "file");
    ok(responseBody.property);
    strictEqual(responseBody.property.name, "file");
    deepStrictEqual(responseBody.contentTypes, ["application/json", "application/yaml"]);
    ok(responseBody.isText);
  });

  it("explicit bodyRoot upload and download", async () => {
    const [
      {
        parameters: { body: requestBody },
        responses: [
          {
            responses: [{ body: responseBody }],
          },
        ],
      },
    ] = await getOperations(`
        ${makeFileModel()}
        op example(@bodyRoot file: SpecFile): { @bodyRoot file: SpecFile };
      `);

    strictEqual(requestBody?.bodyKind, "file");
    ok(requestBody.property);
    strictEqual(requestBody.property.name, "file");
    deepStrictEqual(requestBody?.contentTypes, ["application/json", "application/yaml"]);
    ok(requestBody?.isText);

    strictEqual(responseBody?.bodyKind, "file");
    ok(responseBody.property);
    strictEqual(responseBody.property.name, "file");
    deepStrictEqual(responseBody?.contentTypes, ["application/json", "application/yaml"]);
    ok(responseBody?.isText);
  });

  it("allows interior metadata using bodyRoot", async () => {
    const { operations, runner, diagnostics } = await compileOperationsFull(`
        ${makeFileModel("x-filename")}
        op example(@bodyRoot specFile: SpecFile): { @bodyRoot specFile: SpecFile };
      `);

    strictEqual(diagnostics.length, 0);

    const [
      {
        parameters: { parameters: requestParameters, body: requestBody },
        responses: [
          {
            responses: [{ properties: responseProperties, body: responseBody }],
          },
        ],
      },
    ] = operations;

    strictEqual(requestBody?.bodyKind, "file");
    ok(requestBody.property);
    strictEqual(requestBody.property.name, "specFile");
    deepStrictEqual(requestBody?.contentTypes, ["application/json", "application/yaml"]);
    ok(requestBody?.isText);
    const requestXFilename = requestParameters.find(
      (p) => p.type === "header" && p.name === "x-filename",
    );
    ok(requestXFilename);
    ok(isHeader(runner.program, requestBody.type.properties.get("filename")!));

    strictEqual(responseBody?.bodyKind, "file");
    ok(responseBody.property);
    strictEqual(responseBody.property.name, "specFile");
    deepStrictEqual(responseBody?.contentTypes, ["application/json", "application/yaml"]);
    ok(responseBody?.isText);
    const responseXFilename = responseProperties.find(
      (p) => p.kind === "header" && p.options.name === "x-filename",
    );
    ok(responseXFilename);
    ok(isHeader(runner.program, responseBody.type.properties.get("filename")!));
  });

  describe("multipart", () => {
    it("exact payload form-data upload and download", async () => {
      const {
        operations: [
          {
            parameters: { body: multipartRequestBody },
            responses: [
              {
                responses: [{ body: multipartResponseBody }],
              },
            ],
          },
        ],
        diagnostics,
        runner,
      } = await compileOperationsFull(`
          ${makeFileModel("x-filename")}
          op example(@multipartBody fields: { file: HttpPart<SpecFile> }) : { @multipartBody fields: { file: HttpPart<SpecFile>}};
        `);

      strictEqual(diagnostics.length, 0);

      strictEqual(multipartRequestBody?.bodyKind, "multipart");
      ok(multipartRequestBody?.property);
      deepStrictEqual(multipartRequestBody?.contentTypes, ["multipart/form-data"]);
      strictEqual(multipartRequestBody?.parts.length, 1);
      const requestPartBody = multipartRequestBody?.parts[0].body;
      strictEqual(requestPartBody.bodyKind, "file");
      expect(requestPartBody.property).toStrictEqual(undefined);
      deepStrictEqual(requestPartBody.contentTypes, ["application/json", "application/yaml"]);
      ok(requestPartBody.isText);
      const requestXFilename = multipartRequestBody?.parts[0].headers.find(
        (p) => p.options.name === "x-filename",
      );
      ok(requestXFilename);
      ok(isHeader(runner.program, requestPartBody.type.properties.get("filename")!));

      strictEqual(multipartResponseBody?.bodyKind, "multipart");
      ok(multipartResponseBody?.property);
      deepStrictEqual(multipartResponseBody?.contentTypes, ["multipart/form-data"]);
      strictEqual(multipartResponseBody?.parts.length, 1);
      const responsePartBody = multipartResponseBody?.parts[0].body;
      strictEqual(responsePartBody.bodyKind, "file");
      expect(responsePartBody.property).toStrictEqual(undefined);
      deepStrictEqual(responsePartBody.contentTypes, ["application/json", "application/yaml"]);
      ok(responsePartBody.isText);
      const responseXFilename = multipartResponseBody?.parts[0].headers.find(
        (p) => p.options.name === "x-filename",
      );
      ok(responseXFilename);
      ok(isHeader(runner.program, responsePartBody.type.properties.get("filename")!));
    });

    it("intersect payload form-data upload and download", async () => {
      const {
        operations: [
          {
            parameters: { body: multipartRequestBody },
            responses: [
              {
                responses: [{ body: multipartResponseBody }],
              },
            ],
          },
        ],
        diagnostics,
        runner,
      } = await compileOperationsFull(`
          ${makeFileModel("x-filename")}
          op example(@multipartBody fields: { file: HttpPart<SpecFile & { @header xFoo: string }> }) : { @multipartBody fields: { file: HttpPart<SpecFile & { @header xBar: string }>};};
        `);

      strictEqual(diagnostics.length, 0);

      strictEqual(multipartRequestBody?.bodyKind, "multipart");
      ok(multipartRequestBody?.property);
      deepStrictEqual(multipartRequestBody?.contentTypes, ["multipart/form-data"]);
      strictEqual(multipartRequestBody?.parts.length, 1);
      const requestPartBody = multipartRequestBody?.parts[0].body;
      strictEqual(requestPartBody.bodyKind, "file");
      expect(requestPartBody.property).toStrictEqual(undefined);
      deepStrictEqual(requestPartBody.contentTypes, ["application/json", "application/yaml"]);
      ok(requestPartBody.isText);
      const requestXFilename = multipartRequestBody?.parts[0].headers.find(
        (p) => p.options.name === "x-filename",
      );
      ok(requestXFilename);
      ok(isHeader(runner.program, requestPartBody.type.properties.get("filename")!));
      const requestXFoo = multipartRequestBody?.parts[0].headers.find(
        (p) => p.options.name === "x-foo",
      );
      ok(requestXFoo);
      ok(isHeader(runner.program, requestPartBody.type.properties.get("xFoo")!));

      strictEqual(multipartResponseBody?.bodyKind, "multipart");
      ok(multipartResponseBody?.property);
      deepStrictEqual(multipartResponseBody?.contentTypes, ["multipart/form-data"]);
      strictEqual(multipartResponseBody?.parts.length, 1);
      const responsePartBody = multipartResponseBody?.parts[0].body;
      strictEqual(responsePartBody.bodyKind, "file");
      expect(responsePartBody.property).toStrictEqual(undefined);
      deepStrictEqual(responsePartBody.contentTypes, ["application/json", "application/yaml"]);
      ok(responsePartBody.isText);
      const responseXFilename = multipartResponseBody?.parts[0].headers.find(
        (p) => p.options.name === "x-filename",
      );
      ok(responseXFilename);
      ok(isHeader(runner.program, responsePartBody.type.properties.get("filename")!));
      const responseXBar = multipartResponseBody?.parts[0].headers.find(
        (p) => p.options.name === "x-bar",
      );
      ok(responseXBar);
      ok(isHeader(runner.program, responsePartBody.type.properties.get("xBar")!));
    });
  });
});

describe("structured files", () => {
  it("encodes file as JSON if requested", async () => {
    const {
      diagnostics,
      operations: [
        {
          parameters: { body: requestBody },
          responses: [
            {
              responses: [{ body: responseBody }],
            },
          ],
        },
      ],
    } = await compileOperationsFull(`
        op example(
          @header("content-type") contentType: "application/json",
          @body file: Http.File,
        ): {
          @header("content-type") contentType: "application/json",
          @body file: Http.File,
        };
      `);

    expectDiagnostics(diagnostics, [
      {
        code: "@typespec/http/http-file-structured",
        severity: "warning",
        message:
          "HTTP File body is serialized as a structured model in 'application/json' instead of being treated as the contents of a file because an explicit Content-Type header is defined. Override the `contentType` property of the file model to declare the internal media type of the file's contents, or suppress this warning if you intend to serialize the File as a model.",
      },
      {
        code: "@typespec/http/http-file-structured",
        severity: "warning",
        message:
          "HTTP File body is serialized as a structured model in 'application/json' instead of being treated as the contents of a file because an explicit Content-Type header is defined. Override the `contentType` property of the file model to declare the internal media type of the file's contents, or suppress this warning if you intend to serialize the File as a model.",
      },
    ]);

    strictEqual(requestBody?.bodyKind, "single");
    ok(requestBody?.property);

    strictEqual(requestBody?.contentTypes.length, 1);
    strictEqual(requestBody?.contentTypes[0], "application/json");

    strictEqual(responseBody?.bodyKind, "single");
    ok(responseBody?.property);
    strictEqual(responseBody?.contentTypes.length, 1);
    strictEqual(responseBody?.contentTypes[0], "application/json");
  });

  it("allows nested files serialized as JSON", async () => {
    const {
      diagnostics,
      operations: [
        {
          parameters: { body: requestBody },
          responses: [
            {
              responses: [{ body: responseBody }],
            },
          ],
        },
      ],
    } = await compileOperationsFull(`
        op example(data: { file: Http.File }): { data: { file: Http.File } };
      `);

    expectDiagnosticEmpty(diagnostics);

    strictEqual(requestBody?.bodyKind, "single");
    expect(requestBody?.property).toStrictEqual(undefined);
    strictEqual(requestBody?.contentTypes.length, 1);
    strictEqual(requestBody?.contentTypes[0], "application/json");

    strictEqual(responseBody?.bodyKind, "single");
    expect(responseBody?.property).toStrictEqual(undefined);
    strictEqual(responseBody?.contentTypes.length, 1);
    strictEqual(responseBody?.contentTypes[0], "application/json");
  });

  it("does not recognize a File in a union as a file body", async () => {
    const { diagnostics } = await compileOperationsFull(`
      op example(@body file: Http.File | string): void;
    `);

    expectDiagnostics(diagnostics, [
      {
        code: "@typespec/http/http-file-structured",
        severity: "warning",
        message:
          "HTTP File body is serialized as a structured model instead of being treated as the contents of a file because it is a variant of a union. Declare a separate operation using `@sharedRoute` that has only the File model as the body type to treat it as a file, or suppress this warning if you intend to serialize the File as a model.",
      },
    ]);
  });

  it("does not recognize a File in an intersection as a file body", async () => {
    const {
      operations: [
        {
          responses: [
            {
              responses: [{ body: responseBody }],
            },
          ],
        },
      ],
    } = await compileOperationsFull(`
      op example(): Http.File & OkResponse;
    `);

    strictEqual(responseBody?.bodyKind, "single");
  });

  it("does not recognize composite spreads as a file body", async () => {
    const {
      operations: [
        {
          responses: [
            {
              responses: [{ body: responseBody }],
            },
          ],
        },
      ],
    } = await compileOperationsFull(`
      op example(): { ...Http.File, ...OkResponse };
    `);

    strictEqual(responseBody?.bodyKind, "single");
  });

  it("does not recognize spread with other properties as a file body", async () => {
    const {
      operations: [
        {
          parameters: { body: requestBody },
          responses: [
            {
              responses: [{ body: responseBody }],
            },
          ],
        },
      ],
    } = await compileOperationsFull(`
      op example(
        @path id: string,
        @query type: string,
        @header clientRequestId: string,
        ...Http.File
      ): {
        @header requestId: string,
        ...Http.File
      };
    `);

    strictEqual(requestBody?.bodyKind, "single");

    strictEqual(responseBody?.bodyKind, "single");
  });
});
