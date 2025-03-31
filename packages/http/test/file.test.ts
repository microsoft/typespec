import { expectDiagnosticEmpty, expectDiagnostics } from "@typespec/compiler/testing";
import { deepStrictEqual, ok, strictEqual } from "node:assert";
import { describe, expect, it } from "vitest";
import { isHeader } from "../src/decorators.js";
import { compileOperationsFull, diagnoseOperations, getOperations } from "./test-host.js";

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

it("does not allow instances that improperly provide ContentType argument (is)", async () => {
  const { diagnostics } = await compileOperationsFull(`
    scalar myString extends string;
    model BadFile1 is Http.File<ContentType = myString> {}

    model BadFile2 is Http.File<ContentType = "asdf" | string> {}
  `);

  // Reports each diagnostic twice but with different targets.
  // One targets the model itself (e.g. `BadFile1`), the other targets `Http.File` where the bad template arg assignment occurs.
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
        "The 'contentType' property of the file model must be 'TypeSpec.string', a string literal, or a union of string literals. Found 'TestService.myString'.",
    },
    {
      code: "@typespec/http/http-file-content-type-not-string",
      severity: "error",
      message:
        "The 'contentType' property of the file model must be 'TypeSpec.string', a string literal, or a union of string literals. Found '\"asdf\" | string'.",
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

it("intersect payload download", async () => {
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
      op example(...Http.File): Http.File & OkResponse;
    `);

  strictEqual(requestBody?.bodyKind, "file");
  expect(requestBody?.property).toStrictEqual(undefined);
  deepStrictEqual(requestBody?.contentTypes, ["*/*"]);

  strictEqual(responseBody?.bodyKind, "file");
  expect(responseBody?.property).toStrictEqual(undefined);
  deepStrictEqual(responseBody?.contentTypes, ["*/*"]);
});

it("composite spread payload upload and download", async () => {
  const [
    {
      parameters: { parameters: requestParameters, body: requestBody },
      responses: [
        {
          responses: [{ body: responseBody, headers: responseHeaders }],
        },
      ],
    },
  ] = await getOperations(`
      op example(
        @path id: string,
        @query type: string,
        @header clientRequestId: string,
        ...Http.File
      ): { @header xId: string, ...Http.File, ...OkResponse };
    `);

  strictEqual(requestBody?.bodyKind, "file");
  expect(requestBody?.property).toStrictEqual(undefined);
  deepStrictEqual(requestBody?.contentTypes, ["*/*"]);
  const requestId = requestParameters.find((p) => p.type === "path" && p.name === "id");
  ok(requestId);
  const requestType = requestParameters.find((p) => p.type === "query" && p.name === "type");
  ok(requestType);
  const requestClientRequestId = requestParameters.find(
    (p) => p.type === "header" && p.name === "client-request-id",
  );
  ok(requestClientRequestId);

  strictEqual(responseBody?.bodyKind, "file");
  expect(responseBody?.property).toStrictEqual(undefined);
  deepStrictEqual(responseBody?.contentTypes, ["*/*"]);
  ok(responseHeaders);
  const responseXId = responseHeaders["x-id"];
  ok(responseXId);
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
    const requestPartHeaders = multipartRequestBody?.parts[0].headers;
    strictEqual(requestPartHeaders.length, 1);
    strictEqual(requestPartHeaders[0].kind, "header");
    expect(requestPartHeaders[0].options.name).toStrictEqual("x-foo");
    expect(requestPartBody.property).toStrictEqual(undefined);
    deepStrictEqual(requestPartBody.contentTypes, ["*/*"]);

    strictEqual(multipartResponseBody?.bodyKind, "multipart");
    ok(multipartResponseBody?.property);
    deepStrictEqual(multipartResponseBody?.contentTypes, ["multipart/form-data"]);
    strictEqual(multipartResponseBody?.parts.length, 1);
    const responsePartBody = multipartResponseBody?.parts[0].body;
    strictEqual(responsePartBody.bodyKind, "file");
    const responsePartHeaders = multipartResponseBody?.parts[0].headers;
    strictEqual(responsePartHeaders.length, 1);
    strictEqual(responsePartHeaders[0].kind, "header");
    expect(responsePartHeaders[0].options.name).toStrictEqual("x-bar");
    expect(responsePartBody.property).toStrictEqual(undefined);
    deepStrictEqual(responsePartBody.contentTypes, ["*/*"]);
  });

  it("does not recognize intersection payload form-data upload and download", async () => {
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
        op example(@multipartBody fields: { file: HttpPart<Http.File & { xFoo: string }> }) : { @multipartBody fields: { file: HttpPart<Http.File & { xBar: string }>}};
      `);

    strictEqual(multipartRequestBody?.bodyKind, "multipart");
    ok(multipartRequestBody?.property);
    deepStrictEqual(multipartRequestBody?.contentTypes, ["multipart/form-data"]);
    strictEqual(multipartRequestBody?.parts.length, 1);
    const requestPartBody = multipartRequestBody?.parts[0].body;
    strictEqual(requestPartBody.bodyKind, "single");
    expect(requestPartBody.property).toStrictEqual(undefined);
    deepStrictEqual(requestPartBody.contentTypes, ["application/json"]);

    strictEqual(multipartResponseBody?.bodyKind, "multipart");
    ok(multipartResponseBody?.property);
    deepStrictEqual(multipartResponseBody?.contentTypes, ["multipart/form-data"]);
    strictEqual(multipartResponseBody?.parts.length, 1);
    const responsePartBody = multipartResponseBody?.parts[0].body;
    strictEqual(responsePartBody.bodyKind, "single");
    expect(responsePartBody.property).toStrictEqual(undefined);
    deepStrictEqual(responsePartBody.contentTypes, ["application/json"]);
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

  it("aliasing via model is", async () => {
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
        model SpecFile is Http.File<Contents = string, ContentType = "application/json" | "application/yaml">;
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

  it("extends aliased File", async () => {
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
        model StringFile<T extends string> is Http.File<Contents = string, ContentType = T>;
        model JsonFile extends StringFile<"application/json"> {};
        op example(...JsonFile): JsonFile;
      `);

    strictEqual(requestBody?.bodyKind, "file");
    expect(requestBody?.property).toStrictEqual(undefined);
    deepStrictEqual(requestBody?.contentTypes, ["application/json"]);
    ok(requestBody?.isText);

    strictEqual(responseBody?.bodyKind, "file");
    expect(responseBody?.property).toStrictEqual(undefined);
    deepStrictEqual(responseBody?.contentTypes, ["application/json"]);
    ok(responseBody?.isText);
  });

  it("supports all composition", async () => {
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
        model StringFile<T extends string> is Http.File<Contents = string, ContentType = T>;
        model JsonFile extends StringFile<"application/json"> {};
        model SpreadFile { 
          ...JsonFile;
        }
        model ExtendTheSpread extends SpreadFile {};
        model ExtraForGoodMeasure {
          ...ExtendTheSpread;
        };
        op example(...ExtraForGoodMeasure): ExtraForGoodMeasure;
      `);

    strictEqual(requestBody?.bodyKind, "file");
    expect(requestBody?.property).toStrictEqual(undefined);
    deepStrictEqual(requestBody?.contentTypes, ["application/json"]);
    ok(requestBody?.isText);

    strictEqual(responseBody?.bodyKind, "file");
    expect(responseBody?.property).toStrictEqual(undefined);
    deepStrictEqual(responseBody?.contentTypes, ["application/json"]);
    ok(responseBody?.isText);
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

  it("exact payload upload and download with header", async () => {
    const {
      operations: [
        {
          parameters: { parameters: requestParameters, body: requestBody },
          responses: [
            {
              responses: [{ properties: responseProperties, body: responseBody }],
            },
          ],
        },
      ],
      runner,
    } = await compileOperationsFull(`
        ${makeFileModel("x-filename")}
        op example(...SpecFile): SpecFile;
      `);

    strictEqual(requestBody?.bodyKind, "file");
    expect(requestBody?.property).toStrictEqual(undefined);
    deepStrictEqual(requestBody?.contentTypes, ["application/json", "application/yaml"]);
    ok(requestBody?.isText);
    const requestXFilename = requestParameters.find(
      (p) => p.type === "header" && p.name === "x-filename",
    );
    ok(requestXFilename);
    ok(isHeader(runner.program, requestBody.type.properties.get("filename")!));

    strictEqual(responseBody?.bodyKind, "file");
    expect(responseBody?.property).toStrictEqual(undefined);
    deepStrictEqual(responseBody?.contentTypes, ["application/json", "application/yaml"]);
    ok(responseBody?.isText);
    const responseXFilename = responseProperties.find(
      (p) => p.kind === "header" && p.options.name === "x-filename",
    );
    ok(responseXFilename);
    ok(isHeader(runner.program, responseBody.type.properties.get("filename")!));
  });

  it("extends aliased File with header", async () => {
    const {
      operations: [
        {
          parameters: { parameters: requestParameters, body: requestBody },
          responses: [
            {
              responses: [{ properties: responseProperties, body: responseBody }],
            },
          ],
        },
      ],
      runner,
    } = await compileOperationsFull(`
        model StringFile<T extends string> is Http.File<Contents = string, ContentType = T>;
        model JsonFile extends StringFile<"application/json"> {
          @header("x-filename") filename: string;
        };
        op example(...JsonFile): JsonFile;
      `);

    strictEqual(requestBody?.bodyKind, "file");
    expect(requestBody?.property).toStrictEqual(undefined);
    deepStrictEqual(requestBody?.contentTypes, ["application/json"]);
    ok(requestBody?.isText);
    const requestXFilename = requestParameters.find(
      (p) => p.type === "header" && p.name === "x-filename",
    );
    ok(requestXFilename);
    ok(isHeader(runner.program, requestBody.type.properties.get("filename")!));

    strictEqual(responseBody?.bodyKind, "file");
    expect(responseBody?.property).toStrictEqual(undefined);
    deepStrictEqual(responseBody?.contentTypes, ["application/json"]);
    ok(responseBody?.isText);
    const responseXFilename = responseProperties.find(
      (p) => p.kind === "header" && p.options.name === "x-filename",
    );
    ok(responseXFilename);
    ok(isHeader(runner.program, responseBody.type.properties.get("filename")!));
  });

  it("intersected payload upload and download", async () => {
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
        op example(...SpecFile): SpecFile & OkResponse;
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
          "An HTTP File in a union is serialized as a structured model instead of being treated as the contents of a file. Declare a separate operation using `@sharedRoute` that has only the File model as the body type to treat it as a file, or suppress this warning if you intend to serialize the File as a model.",
      },
    ]);
  });

  it("does not recognize intersection with non-metadata fields as a file body", async () => {
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
      op example(): Http.File & { foo: string };
    `);

    strictEqual(responseBody?.bodyKind, "single");
  });

  it("does not recognize spread with other non-metadata properties as a file body", async () => {
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
        foo: string;
        ...Http.File
      ): {
        foo: string;
        ...Http.File
      };
    `);

    strictEqual(requestBody?.bodyKind, "single");

    strictEqual(responseBody?.bodyKind, "single");
  });
});

describe("metadata on file properties", () => {
  type AllowedForFilename = boolean;
  const annotations: Record<string, AllowedForFilename> = {
    header: true,
    cookie: false,
    query: true,
    path: true,
    body: false,
    bodyRoot: false,
    multipartBody: false,
    statusCode: false,
  };

  for (const propertyOverride of ["contents", "contentType", "filename"] as const) {
    for (const [metadataDecorator, allowedForFilename] of Object.entries(annotations)) {
      const isAllowed = propertyOverride === "filename" && allowedForFilename;
      it(`${isAllowed ? "allows" : "disallows"} @${metadataDecorator} on '${propertyOverride}'`, async () => {
        const diagnostics = await diagnoseOperations(`
          model MyFile extends File<Contents = string> {
            @${metadataDecorator} ${propertyOverride}: string;
          }
        `);

        if (isAllowed) {
          expectDiagnosticEmpty(diagnostics);
        } else {
          expectDiagnostics(diagnostics, [
            {
              code: "@typespec/http/http-file-disallowed-metadata",
              severity: "error",
              message: `File model cannot define HTTP metadata type '${metadataDecorator}' on property '${propertyOverride}'.`,
            },
          ]);
        }
      });
    }
  }
});
