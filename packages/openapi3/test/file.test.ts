import { describe, expect, it } from "vitest";
import { worksFor } from "./works-for.js";

worksFor(["3.0.0", "3.1.0"], ({ openApiFor, version }) => {
  function getRawBinarySchema<T extends string>(contentMediaType?: T) {
    if (version === "3.0.0") {
      return { type: "string", format: "binary" } as const;
    }

    // Open API 3.1 does not specify type/format.
    // It contains an (often redundant/optional) `contentMediaType` property instead.
    if (contentMediaType) {
      return { contentMediaType } as const;
    } else {
      return {} as const;
    }
  }

  function getEncodedBinarySchema() {
    if (version === "3.0.0") {
      return { type: "string", format: "byte" } as const;
    } else {
      return { type: "string", contentEncoding: "base64" } as const;
    }
  }

  it.each([
    { name: "explicit", tsOperation: "op example(...Http.File): Http.File;" },
    {
      name: "@bodyRoot",
      tsOperation: "op example(@bodyRoot file: Http.File): { @bodyRoot file: Http.File };",
    },
    {
      name: "@body",
      tsOperation: "op example(@body file: Http.File): { @body file: Http.File };",
    },
  ])("supports Http.File ($name)", async ({ tsOperation }) => {
    const rawBinarySchema = getRawBinarySchema("*/*");
    const result = await openApiFor(tsOperation);

    const operation = result.paths["/"].post;
    const requestBody = operation.requestBody.content;
    const response = operation.responses["200"].content;

    expect(requestBody["*/*"]).toStrictEqual({ schema: rawBinarySchema });
    expect(response["*/*"]).toStrictEqual({ schema: rawBinarySchema });
  });

  it("supports Http.File when intersected", async () => {
    const rawBinarySchema = getRawBinarySchema("*/*");
    const result = await openApiFor(
      "op example(...Http.File): Http.File & Http.OkResponse & { @header xBar: string; };",
    );

    const operation = result.paths["/"].post;
    const requestBody = operation.requestBody.content;
    const response = operation.responses["200"];

    // Verify headers are correctly extracted.
    expect(response.headers).toStrictEqual({
      "x-bar": { schema: { type: "string" }, required: true },
    });

    // Verify bodies are still raw binary (File)
    expect(requestBody["*/*"]).toStrictEqual({ schema: rawBinarySchema });
    expect(response.content["*/*"]).toStrictEqual({ schema: rawBinarySchema });
  });

  it.each([
    { name: "explicit", tsOperation: "op example(...SpecFile): SpecFile;", contents: "string" },
    { name: "explicit", tsOperation: "op example(...SpecFile): SpecFile;", contents: "bytes" },
    {
      name: "@body",
      tsOperation: "op example(@body file: SpecFile): { @body file: SpecFile };",
      contents: "string",
    },
    {
      name: "@body",
      tsOperation: "op example(@body file: SpecFile): { @body file: SpecFile };",
      contents: "bytes",
    },
    {
      name: "@bodyRoot",
      tsOperation: "op example(@bodyRoot file: SpecFile): { @bodyRoot file: SpecFile };",
      contents: "string",
    },
    {
      name: "@bodyRoot",
      tsOperation: "op example(@bodyRoot file: SpecFile): { @bodyRoot file: SpecFile };",
      contents: "bytes",
    },
  ])(
    "supports extended Http.File $contents contents ($name)",
    async ({ tsOperation, contents }) => {
      const fileModel = `
          model SpecFile extends Http.File<Contents = ${contents}> {
            contentType: "application/json" | "application/yaml";
            filename: string;
          }
        `;

      const jsonRawBinarySchema = getRawBinarySchema("application/json");
      const yamlRawBinarySchema = getRawBinarySchema("application/yaml");

      const result = await openApiFor(`${fileModel}\n${tsOperation}`);

      const operation = result.paths["/"].post;
      const requestBody = operation.requestBody.content;
      const response = operation.responses["200"].content;

      expect(requestBody["application/json"]).toStrictEqual({ schema: jsonRawBinarySchema });
      expect(requestBody["application/yaml"]).toStrictEqual({ schema: yamlRawBinarySchema });
      expect(response["application/json"]).toStrictEqual({ schema: jsonRawBinarySchema });
      expect(response["application/yaml"]).toStrictEqual({ schema: yamlRawBinarySchema });
    },
  );

  it("supports extended Http.File $contents contents (intersection)", async () => {
    const jsonRawBinarySchema = getRawBinarySchema("application/json");
    const yamlRawBinarySchema = getRawBinarySchema("application/yaml");

    const result = await openApiFor(`
       model SpecFile extends Http.File<Contents = bytes> {
        contentType: "application/json" | "application/yaml";
        filename: string;
      }
      op example(...SpecFile, @header xFoo: string): SpecFile & OkResponse & { @header xBar: string; };
    `);

    const operation = result.paths["/"].post;
    const requestBody = operation.requestBody.content;
    const response = operation.responses["200"];

    // Verify headers are correctly extracted.
    expect(operation.parameters[0]).toStrictEqual({
      in: "header",
      name: "x-foo",
      schema: { type: "string" },
      required: true,
    });
    expect(response.headers).toStrictEqual({
      "x-bar": { schema: { type: "string" }, required: true },
    });

    expect(requestBody["application/json"]).toStrictEqual({ schema: jsonRawBinarySchema });
    expect(requestBody["application/yaml"]).toStrictEqual({ schema: yamlRawBinarySchema });
    expect(response.content["application/json"]).toStrictEqual({ schema: jsonRawBinarySchema });
    expect(response.content["application/yaml"]).toStrictEqual({ schema: yamlRawBinarySchema });
  });

  it("allows interior metadata using @bodyRoot on extended Http.File", async () => {
    const result = await openApiFor(`
        model SpecFile extends Http.File {
          contentType: "application/json" | "application/yaml";
          @header("x-filename") filename: string;
        }
        
        op example(@bodyRoot file: SpecFile): { @bodyRoot file: SpecFile };
      `);

    const jsonRawBinarySchema = getRawBinarySchema("application/json");
    const yamlRawBinarySchema = getRawBinarySchema("application/yaml");

    const operation = result.paths["/"].post;
    const requestBody = operation.requestBody.content;
    const response = operation.responses["200"];
    const responseBodies = response.content;

    expect(operation.parameters).toStrictEqual([
      {
        in: "header",
        name: "x-filename",
        schema: { type: "string" },
        required: true,
      },
    ]);

    expect(response.headers).toStrictEqual({
      "x-filename": { schema: { type: "string" }, required: true },
    });

    expect(requestBody["application/json"]).toStrictEqual({ schema: jsonRawBinarySchema });
    expect(requestBody["application/yaml"]).toStrictEqual({ schema: yamlRawBinarySchema });
    expect(responseBodies["application/json"]).toStrictEqual({ schema: jsonRawBinarySchema });
    expect(responseBodies["application/yaml"]).toStrictEqual({ schema: yamlRawBinarySchema });
  });

  it("allows nested files serialized as JSON", async () => {
    const result = await openApiFor(`
        op example(data: { file: Http.File }): { data: { file: Http.File } };
      `);

    const encodedBinarySchema = getEncodedBinarySchema();

    const operation = result.paths["/"].post;
    const requestBody = operation.requestBody.content;
    const response = operation.responses["200"].content;

    const expectedObjectSchema = {
      schema: {
        type: "object",
        properties: {
          data: {
            type: "object",
            properties: {
              file: {
                type: "object",
                properties: {
                  contentType: { type: "string" },
                  contents: encodedBinarySchema,
                  filename: { type: "string" },
                },
                required: ["contents"],
              },
            },
            required: ["file"],
          },
        },
        required: ["data"],
      },
    };

    expect(requestBody["application/json"]).toMatchObject(expectedObjectSchema);
    expect(response["application/json"]).toMatchObject(expectedObjectSchema);
  });

  it("encodes structured file as JSON if requested", async () => {
    const result = await openApiFor(`
        #suppress "@typespec/http/http-file-structured" "testing"
        op example(
          @header("content-type") contentType: "application/json", @body file: Http.File
        ): { @header("content-type") contentType: "application/json", @body file: Http.File };
      `);

    const encodedBinarySchema = getEncodedBinarySchema();

    const operation = result.paths["/"].post;
    const requestBody = operation.requestBody.content;
    const response = operation.responses["200"].content;

    const expectedObjectSchema = {
      type: "object",
      properties: {
        contentType: { type: "string" },
        contents: encodedBinarySchema,
        filename: { type: "string" },
      },
      required: ["contents"],
    };

    expect(requestBody["application/json"]).toMatchObject({ schema: expectedObjectSchema });
    expect(response["application/json"]).toMatchObject({ schema: expectedObjectSchema });
  });

  it.each([
    {
      name: "spread",
      tsOperation: `op example(...Http.File, foo: string): { ...Http.File, foo: string };`,
    },
    {
      name: "intersect",
      tsOperation: `op example(...Http.File, foo: string): Http.File & { foo: string };`,
    },
  ])(
    "does not recognize File when sibling non-metadata fields present ($name)",
    async ({ tsOperation }) => {
      const result = await openApiFor(tsOperation);

      const encodedBinarySchema = getEncodedBinarySchema();

      const operation = result.paths["/"].post;
      const requestBody = operation.requestBody.content;
      const response = operation.responses["200"].content;

      const expectedObjectSchema = {
        type: "object",
        properties: {
          contentType: { type: "string" },
          contents: encodedBinarySchema,
          filename: { type: "string" },
          foo: { type: "string" },
        },
        required: ["contents", "foo"],
      };

      expect(requestBody["application/json"]).toMatchObject({ schema: expectedObjectSchema });
      expect(response["application/json"]).toMatchObject({ schema: expectedObjectSchema });
    },
  );

  describe("multipart", () => {
    it.each([
      {
        tsOperation: `op example(@multipartBody fields: { file: HttpPart<File> }): { @multipartBody fields: { file: HttpPart<File> } };`,
        name: "exact payload",
      },
      {
        tsOperation: `op example(@multipartBody fields: { file: HttpPart<{...File}> }): { @multipartBody fields: { file: HttpPart<{...File}> } };`,
        name: "exact payload with spread",
      },
      {
        tsOperation: `op example(@multipartBody fields: { file: HttpPart<{ @bodyRoot file: File }> }): { @multipartBody fields: { file: HttpPart<{ @bodyRoot file: File }> } };`,
        name: "explicit @bodyRoot",
      },
      {
        tsOperation: `op example(@multipartBody fields: { file: HttpPart<{ @body file: File }> }): { @multipartBody fields: { file: HttpPart<{ @body file: File }> } };`,
        name: "explicit @body",
      },
    ])("form-data upload and download ($name)", async ({ tsOperation }) => {
      const result = await openApiFor(tsOperation);

      // `contentMediaType` is omitted for Open API 3.1 because `contentType` is specified in `encoding`.
      const rawBinarySchema = getRawBinarySchema();

      const operation = result.paths["/"].post;
      const requestBody = operation.requestBody.content;
      const response = operation.responses["200"].content;

      expect(requestBody["multipart/form-data"].schema).toStrictEqual({
        type: "object",
        properties: {
          file: rawBinarySchema,
        },
        required: ["file"],
      });
      expect(requestBody["multipart/form-data"].encoding).toStrictEqual({
        file: {
          contentType: "*/*",
        },
      });

      expect(response["multipart/form-data"].schema).toStrictEqual({
        type: "object",
        properties: {
          file: rawBinarySchema,
        },
        required: ["file"],
      });
      expect(response["multipart/form-data"].encoding).toStrictEqual({
        file: {
          contentType: "*/*",
        },
      });
    });

    it.each([
      {
        name: "spread",
        tsOperation: `op example(@multipartBody fields: { file: HttpPart<{...File,  foo: string }> }): { @multipartBody fields: { file: HttpPart<{...File, foo: string }> } };`,
      },
      {
        name: "intersect",
        tsOperation: `op example(@multipartBody fields: { file: HttpPart<File & { foo: string }> }): { @multipartBody fields: { file: HttpPart<File & { foo: string }> } };`,
      },
    ])(
      "does not recognize File when sibling non-metadata fields present ($name)",
      async ({ tsOperation }) => {
        const result = await openApiFor(tsOperation);

        const encodedBinarySchema = getEncodedBinarySchema();

        const operation = result.paths["/"].post;
        const requestBody = operation.requestBody.content;
        const response = operation.responses["200"].content;

        const expectedObjectSchema = {
          type: "object",
          properties: {
            file: {
              type: "object",
              properties: {
                contentType: { type: "string" },
                contents: encodedBinarySchema,
                filename: { type: "string" },
                foo: { type: "string" },
              },
              required: ["contents", "foo"],
            },
          },
        };

        expect(requestBody["multipart/form-data"].schema).toMatchObject(expectedObjectSchema);
        expect(response["multipart/form-data"].schema).toMatchObject(expectedObjectSchema);
      },
    );

    it("form-data upload and download (intersection)", async () => {
      const result = await openApiFor(
        "op example(@multipartBody fields: { file: HttpPart<File & { @header xFoo: string }> }): { @multipartBody fields: { file: HttpPart<File & { @header xBar: string }> } };",
      );

      // `contentMediaType` is omitted for Open API 3.1 because `contentType` is specified in `encoding`.
      const rawBinarySchema = getRawBinarySchema();

      const operation = result.paths["/"].post;
      const requestBody = operation.requestBody.content;
      const response = operation.responses["200"].content;

      expect(requestBody["multipart/form-data"].schema).toStrictEqual({
        type: "object",
        properties: {
          file: rawBinarySchema,
        },
        required: ["file"],
      });
      expect(requestBody["multipart/form-data"].encoding).toStrictEqual({
        file: {
          contentType: "*/*",
          headers: {
            "x-foo": { schema: { type: "string" }, required: true },
          },
        },
      });

      expect(response["multipart/form-data"].schema).toStrictEqual({
        type: "object",
        properties: {
          file: rawBinarySchema,
        },
        required: ["file"],
      });
      expect(response["multipart/form-data"].encoding).toStrictEqual({
        file: {
          contentType: "*/*",
          headers: {
            "x-bar": { schema: { type: "string" }, required: true },
          },
        },
      });
    });

    it.each([
      {
        name: "exact",
        tsOperation: `op example(@multipartBody fields: { file: HttpPart<SpecFile> }): { @multipartBody fields: { file: HttpPart<SpecFile> }};`,
        contents: "string",
      },
      {
        name: "exact",
        tsOperation: `op example(@multipartBody fields: { file: HttpPart<SpecFile> }): { @multipartBody fields: { file: HttpPart<SpecFile> }};`,
        contents: "bytes",
      },
      {
        name: "spread",
        tsOperation: `op example(@multipartBody fields: { file: HttpPart<{ ...SpecFile }> }): { @multipartBody fields: { file: HttpPart<{ ...SpecFile }> }};`,
        contents: "string",
      },
      {
        name: "spread",
        tsOperation: `op example(@multipartBody fields: { file: HttpPart<{ ...SpecFile }> }): { @multipartBody fields: { file: HttpPart<{ ...SpecFile }> }};`,
        contents: "bytes",
      },
      {
        name: "@bodyRoot",
        tsOperation: `op example(@multipartBody fields: { file: HttpPart<{ @bodyRoot file: SpecFile }> }): { @multipartBody fields: { file: HttpPart<{ @bodyRoot file: SpecFile }> }};`,
        contents: "string",
      },
      {
        name: "@bodyRoot",
        tsOperation: `op example(@multipartBody fields: { file: HttpPart<{ @bodyRoot file: SpecFile }> }): { @multipartBody fields: { file: HttpPart<{ @bodyRoot file: SpecFile }> }};`,
        contents: "bytes",
      },
    ])(
      "supports extended Http.File $contents contents ($name)",
      async ({ tsOperation, contents }) => {
        const fileModel = `
            model SpecFile extends Http.File<Contents = ${contents}> {
              contentType: "application/json" | "application/yaml";
              @header("x-filename") filename: string;
            }
          `;

        const result = await openApiFor(`${fileModel}\n${tsOperation}`);

        // `contentMediaType` is omitted for Open API 3.1 because `contentType` is specified in `encoding`.
        const rawBinarySchema = getRawBinarySchema();

        const operation = result.paths["/"].post;
        const requestBody = operation.requestBody.content;
        const response = operation.responses["200"].content;

        expect(requestBody["multipart/form-data"].schema).toStrictEqual({
          type: "object",
          properties: {
            file: rawBinarySchema,
          },
          required: ["file"],
        });
        expect(requestBody["multipart/form-data"].encoding).toStrictEqual({
          file: {
            contentType: "application/json, application/yaml",
            headers: {
              "x-filename": { schema: { type: "string" }, required: true },
            },
          },
        });

        expect(response["multipart/form-data"].schema).toStrictEqual({
          type: "object",
          properties: {
            file: rawBinarySchema,
          },
          required: ["file"],
        });
        expect(response["multipart/form-data"].encoding).toStrictEqual({
          file: {
            contentType: "application/json, application/yaml",
            headers: {
              "x-filename": { schema: { type: "string" }, required: true },
            },
          },
        });
      },
    );

    it("supports extended Http.File $contents contents (intersection)", async () => {
      const result = await openApiFor(`
        model SpecFile extends Http.File<Contents = bytes> {
          contentType: "application/json" | "application/yaml";
          @header("x-filename") filename: string;
        }
        op example(@multipartBody fields: { file: HttpPart<SpecFile & { @header xFoo: string }> }): { @multipartBody fields: { file: HttpPart<SpecFile & { @header xBar: string }> }};  
      `);

      // `contentMediaType` is omitted for Open API 3.1 because `contentType` is specified in `encoding`.
      const rawBinarySchema = getRawBinarySchema();

      const operation = result.paths["/"].post;
      const requestBody = operation.requestBody.content;
      const response = operation.responses["200"].content;

      expect(requestBody["multipart/form-data"].schema).toStrictEqual({
        type: "object",
        properties: {
          file: rawBinarySchema,
        },
        required: ["file"],
      });
      expect(requestBody["multipart/form-data"].encoding).toStrictEqual({
        file: {
          contentType: "application/json, application/yaml",
          headers: {
            "x-filename": { schema: { type: "string" }, required: true },
            "x-foo": { schema: { type: "string" }, required: true },
          },
        },
      });

      expect(response["multipart/form-data"].schema).toStrictEqual({
        type: "object",
        properties: {
          file: rawBinarySchema,
        },
        required: ["file"],
      });
      expect(response["multipart/form-data"].encoding).toStrictEqual({
        file: {
          contentType: "application/json, application/yaml",
          headers: {
            "x-filename": { schema: { type: "string" }, required: true },
            "x-bar": { schema: { type: "string" }, required: true },
          },
        },
      });
    });
  });
});
