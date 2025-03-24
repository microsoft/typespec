import { expectDiagnosticEmpty, expectDiagnostics } from "@typespec/compiler/testing";
import { deepStrictEqual, ok, strictEqual } from "node:assert";
import { describe, it } from "vitest";
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
      model BadFile1 extends Http.File<string | bytes> {}

      model BadFile2 extends Http.File<"asdf"> {}
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
        "The 'contents' property of the file model must be a scalar type that extends 'string' or 'bytes'. Found '<value>'.",
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
  strictEqual(requestBody?.property, undefined);
  deepStrictEqual(requestBody?.contentTypes, ["*/*"]);

  strictEqual(responseBody?.bodyKind, "file");
  strictEqual(responseBody?.property, undefined);
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
  strictEqual(requestBody?.property, undefined);
  deepStrictEqual(requestBody?.contentTypes, ["*/*"]);

  strictEqual(responseBody?.bodyKind, "file");
  strictEqual(responseBody?.property, undefined);
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
  strictEqual(requestBody?.property, undefined);
  deepStrictEqual(requestBody?.contentTypes, ["*/*"]);

  strictEqual(responseBody?.bodyKind, "file");
  strictEqual(responseBody?.property, undefined);
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
    strictEqual(requestPartBody.property, undefined);
    deepStrictEqual(requestPartBody.contentTypes, ["*/*"]);

    strictEqual(multipartResponseBody?.bodyKind, "multipart");
    ok(multipartResponseBody?.property);
    deepStrictEqual(multipartResponseBody?.contentTypes, ["multipart/form-data"]);
    strictEqual(multipartResponseBody?.parts.length, 1);
    const responsePartBody = multipartResponseBody?.parts[0].body;
    strictEqual(responsePartBody.bodyKind, "file");
    strictEqual(responsePartBody.property, undefined);
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
    strictEqual(requestPartBody.property, undefined);
    deepStrictEqual(requestPartBody.contentTypes, ["*/*"]);

    strictEqual(multipartResponseBody?.bodyKind, "multipart");
    ok(multipartResponseBody?.property);
    deepStrictEqual(multipartResponseBody?.contentTypes, ["multipart/form-data"]);
    strictEqual(multipartResponseBody?.parts.length, 1);
    const responsePartBody = multipartResponseBody?.parts[0].body;
    strictEqual(responsePartBody.bodyKind, "file");
    strictEqual(responsePartBody.property, undefined);
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
    strictEqual(requestPartBody.property, undefined);
    deepStrictEqual(requestPartBody.contentTypes, ["*/*"]);

    strictEqual(multipartResponseBody?.bodyKind, "multipart");
    ok(multipartResponseBody?.property);
    deepStrictEqual(multipartResponseBody?.contentTypes, ["multipart/form-data"]);
    strictEqual(multipartResponseBody?.parts.length, 1);
    const responsePartBody = multipartResponseBody?.parts[0].body;
    strictEqual(responsePartBody.bodyKind, "file");
    strictEqual(responsePartBody.property, undefined);
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
    strictEqual(requestPartBody.property, undefined);
    deepStrictEqual(requestPartBody.contentTypes, ["*/*"]);

    strictEqual(multipartResponseBody?.bodyKind, "multipart");
    ok(multipartResponseBody?.property);
    deepStrictEqual(multipartResponseBody?.contentTypes, ["multipart/form-data"]);
    strictEqual(multipartResponseBody?.parts.length, 1);
    const responsePartBody = multipartResponseBody?.parts[0].body;
    strictEqual(responsePartBody.bodyKind, "file");
    strictEqual(responsePartBody.property, undefined);
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
    strictEqual(requestBody?.property, undefined);
    deepStrictEqual(requestBody?.contentTypes, ["application/json", "application/yaml"]);
    ok(requestBody?.isText);

    strictEqual(responseBody?.bodyKind, "file");
    strictEqual(responseBody?.property, undefined);
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
    strictEqual(requestBody?.property, undefined);
    deepStrictEqual(requestBody?.contentTypes, ["application/json", "application/yaml"]);
    ok(requestBody?.isText);

    strictEqual(responseBody?.bodyKind, "file");
    strictEqual(responseBody?.property, undefined);
    deepStrictEqual(responseBody?.contentTypes, ["application/json", "application/yaml"]);
    ok(responseBody?.isText);
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
    strictEqual(requestBody?.property, undefined);
    deepStrictEqual(requestBody?.contentTypes, ["application/json", "application/yaml"]);
    ok(requestBody?.isText);

    strictEqual(responseBody?.bodyKind, "file");
    strictEqual(responseBody?.property, undefined);
    deepStrictEqual(responseBody?.contentTypes, ["application/json", "application/yaml"]);
    ok(responseBody?.isText);
  });

  it("allows interior metadata using bodyRoot", async () => {
    const { operations, runner, diagnostics } = await compileOperationsFull(`
        ${makeFileModel("x-filename")}
        op example(@bodyRoot file: SpecFile): { @bodyRoot file: SpecFile };
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
    strictEqual(requestBody?.property, undefined);
    deepStrictEqual(requestBody?.contentTypes, ["application/json", "application/yaml"]);
    ok(requestBody?.isText);
    const requestXFilename = requestParameters.find(
      (p) => p.type === "header" && p.name === "x-filename",
    );
    ok(requestXFilename);
    ok(isHeader(runner.program, requestBody.type.properties.get("filename")!));

    strictEqual(responseBody?.bodyKind, "file");
    strictEqual(responseBody?.property, undefined);
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
      strictEqual(requestPartBody.property, undefined);
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
      strictEqual(responsePartBody.property, undefined);
      deepStrictEqual(responsePartBody.contentTypes, ["application/json", "application/yaml"]);
      ok(responsePartBody.isText);
      const responseXFilename = multipartResponseBody?.parts[0].headers.find(
        (p) => p.options.name === "x-filename",
      );
      ok(responseXFilename);
      ok(isHeader(runner.program, responsePartBody.type.properties.get("filename")!));
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
          "HTTP File body is treated as a structured model and serialized to 'application/json' because an explicit Content-Type header is defined. Override the `contentType` property of the file model to declare the internal media type of the file's contents, or suppress this warning if you intend to serialize the File as a model.",
      },
      {
        code: "@typespec/http/http-file-structured",
        severity: "warning",
        message:
          "HTTP File body is treated as a structured model and serialized to 'application/json' because an explicit Content-Type header is defined. Override the `contentType` property of the file model to declare the internal media type of the file's contents, or suppress this warning if you intend to serialize the File as a model.",
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
    strictEqual(requestBody?.property, undefined);
    strictEqual(requestBody?.contentTypes.length, 1);
    strictEqual(requestBody?.contentTypes[0], "application/json");

    strictEqual(responseBody?.bodyKind, "single");
    strictEqual(responseBody?.property, undefined);
    strictEqual(responseBody?.contentTypes.length, 1);
    strictEqual(responseBody?.contentTypes[0], "application/json");
  });
});
