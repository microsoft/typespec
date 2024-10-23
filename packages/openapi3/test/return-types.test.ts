import { expectDiagnosticEmpty, expectDiagnostics } from "@typespec/compiler/testing";
import { deepStrictEqual, ok, strictEqual } from "assert";
import { describe, expect, it } from "vitest";
import { checkFor, openApiFor } from "./test-host.js";

describe("openapi3: return types", () => {
  it("model used with @body and without shouldn't conflict if it contains no metadata", async () => {
    const res = await openApiFor(
      `
      model Foo {
        name: string;
      }
      @route("c1") op c1(): Foo;
      @route("c2") op c2(): {@body _: Foo};
      `,
    );
    deepStrictEqual(res.paths["/c1"].get.responses["200"].content["application/json"].schema, {
      $ref: "#/components/schemas/Foo",
    });
    deepStrictEqual(res.paths["/c2"].get.responses["200"].content["application/json"].schema, {
      $ref: "#/components/schemas/Foo",
    });
  });

  it("defines responses with response headers", async () => {
    const res = await openApiFor(
      `
      model ETagHeader {
        @header eTag: string;
      }
      model Key {
        key: string;
      }
      @get() op read(): Key & ETagHeader;
      `,
    );
    ok(res.paths["/"].get.responses["200"].headers);
    ok(res.paths["/"].get.responses["200"].headers["e-tag"]);
  });

  it("defines responses with status codes", async () => {
    const res = await openApiFor(
      `
      @service({ name:"Test" })
      namespace Test {
        model CreatedResponse {
          @statusCode code: "201";
        }
        model Key {
          key: string;
        }
        @put op create(): CreatedResponse & Key;  
      }
      `,
    );
    ok(res.paths["/"].put.responses["201"]);
    ok(res.paths["/"].put.responses["201"].content["application/json"].schema);
  });

  it("defines responses with numeric status codes", async () => {
    const res = await openApiFor(
      `
      @service({ name:"Test" })
      namespace Test {
        model CreatedResponse {
          @statusCode code: 201;
        }
        model Key {
          key: string;
        }
        @put op create(): CreatedResponse & Key;
      }
      `,
    );
    ok(res.paths["/"].put.responses["201"]);
    ok(res.paths["/"].put.responses["201"].content["application/json"].schema);
  });

  it("defines responses with headers and status codes", async () => {
    const res = await openApiFor(
      `
      @service({ name:"Test" })
      namespace Test {
        model ETagHeader {
          @header eTag: string;
        }
        model CreatedResponse {
          @statusCode code: "201";
        }
        model Key {
          key: string;
        }
        @put op create(): { ...CreatedResponse, ...ETagHeader, @body body: Key};
      }
      `,
    );
    ok(res.paths["/"].put.responses["201"]);
    ok(res.paths["/"].put.responses["201"].headers["e-tag"]);
    deepStrictEqual(res.paths["/"].put.responses["201"].content["application/json"].schema, {
      $ref: "#/components/schemas/Key",
    });
  });

  it("response header are marked required", async () => {
    const res = await openApiFor(
      `
      @put op create(): {@header eTag: string};
      `,
    );
    ok(res.paths["/"].put.responses["200"]);
    ok(res.paths["/"].put.responses["200"].headers["e-tag"]);
    strictEqual(res.paths["/"].put.responses["200"].headers["e-tag"].required, true);
  });

  it("optional response header are marked required: false", async () => {
    const res = await openApiFor(
      `
      @put op create(): {@header eTag?: string};
      `,
    );
    ok(res.paths["/"].put.responses["200"]);
    ok(res.paths["/"].put.responses["200"].headers["e-tag"]);
    strictEqual(res.paths["/"].put.responses["200"].headers["e-tag"].required, false);
  });

  it("defines responses with headers and status codes in base model", async () => {
    const res = await openApiFor(
      `
      @service({ name:"Test" })
      namespace Test {
        model CreatedResponse {
          @statusCode code: "201";
          @header contentType: "text/html";
          @header location: string;
        }
        model Page {
          content: string;
        }
        model CreatePageResponse extends CreatedResponse {
          @body body: Page;
        }
        @put op create(): CreatePageResponse;
      }
      `,
    );
    ok(res.paths["/"].put.responses["201"]);
    ok(res.paths["/"].put.responses["201"].headers["location"]);
    deepStrictEqual(res.paths["/"].put.responses["201"].content["text/html"].schema, {
      $ref: "#/components/schemas/Page",
    });
  });

  it("defines separate responses for each status code defined as a union of values", async () => {
    const res = await openApiFor(
      `
      model CreatedOrUpdatedResponse {
        @statusCode code: "200" | "201";
      }
      model DateHeader {
        @header date: utcDateTime;
      }
      model Key {
        key: string;
      }
      @put op create(): CreatedOrUpdatedResponse & DateHeader & Key;
      `,
    );
    ok(res.paths["/"].put.responses["200"]);
    ok(res.paths["/"].put.responses["201"]);
    // Note: 200 and 201 response should be equal except for description
    deepStrictEqual(
      res.paths["/"].put.responses["200"].headers,
      res.paths["/"].put.responses["201"].headers,
    );
    deepStrictEqual(
      res.paths["/"].put.responses["200"].content,
      res.paths["/"].put.responses["201"].content,
    );
  });

  it("defines separate responses for each variant of a union return type", async () => {
    const res = await openApiFor(
      `
      @doc("Error")
      @defaultResponse
      model Error {
        code: int32;
        message: string;
      }
      model Key {
        key: string;
      }
      @get op read(): Key | Error;
      `,
    );
    ok(res.paths["/"].get.responses["200"]);
    ok(res.components.schemas.Key);
    deepStrictEqual(res.paths["/"].get.responses["200"].content["application/json"].schema, {
      $ref: "#/components/schemas/Key",
    });
    ok(res.components.schemas.Error);
    deepStrictEqual(res.paths["/"].get.responses["default"].content["application/json"].schema, {
      $ref: "#/components/schemas/Error",
    });
  });

  it("defines the response media type from the content-type header if present", async () => {
    const res = await openApiFor(
      `
      @doc("Error")
      @defaultResponse
      model Error {
        code: int32;
        message: string;
      }
      model TextPlain {
        @header contentType: "text/plain";
      }
      model Key {
        key: string;
      }
      
      // Note: & takes precedence over |
      @get op read(): Key & TextPlain | Error;
      `,
    );
    ok(res.paths["/"].get.responses["200"]);
    ok(res.paths["/"].get.responses["200"].content["text/plain"].schema);
    ok(res.components.schemas.Error);
    deepStrictEqual(res.paths["/"].get.responses["default"].content["application/json"].schema, {
      $ref: "#/components/schemas/Error",
    });
  });

  it("defines the multiple response media types for content-type header with union value", async () => {
    const res = await openApiFor(
      `
      model TextMulti {
        @header contentType: "text/plain" | "text/html" | "text/csv";
      }
      @get op read(): { ...TextMulti, @body body: string };
    `,
    );
    ok(res.paths["/"].get.responses["200"]);
    ok(res.paths["/"].get.responses["200"].content["text/plain"]);
    ok(res.paths["/"].get.responses["200"].content["text/html"]);
    ok(res.paths["/"].get.responses["200"].content["text/csv"]);
  });

  it("defines responses with primitive types", async () => {
    const res = await openApiFor(`
      @get() op read(): string;
      `);
    ok(res.paths["/"].get.responses["200"]);
    ok(res.paths["/"].get.responses["200"].content);
    strictEqual(
      res.paths["/"].get.responses["200"].content["application/json"].schema.type,
      "string",
    );
  });

  it("defines responses with top-level array type", async () => {
    const res = await openApiFor(
      `
      model Foo {
        foo: string;
      }
      @get() op read(): Foo[];
      `,
    );
    ok(res.paths["/"].get.responses["200"]);
    ok(res.paths["/"].get.responses["200"].content);
    strictEqual(
      res.paths["/"].get.responses["200"].content["application/json"].schema.type,
      "array",
    );
  });

  it("produce additionalProperties schema if response is Record<T>", async () => {
    const res = await openApiFor(
      `
      @get op test(): Record<string>;
      `,
    );

    const responses = res.paths["/"].get.responses;
    ok(responses["200"]);
    deepStrictEqual(responses["200"].content, {
      "application/json": {
        schema: {
          type: "object",
          additionalProperties: {
            type: "string",
          },
        },
      },
    });
  });

  it("return type with only response metadata should be 204 response w/ no content", async () => {
    const res = await openApiFor(`
      @get op delete(): {@header date: string};
    `);

    const responses = res.paths["/"].get.responses;
    ok(responses["200"]);
    ok(responses["200"].content === undefined, "response should have no content");
    ok(responses["204"] === undefined);
  });

  it("defaults status code to default when model has @error decorator", async () => {
    const res = await openApiFor(
      `
      @error
      model Error {
        code: string;
      }

      model Foo {
        foo: string;
      }

      @get op get(): Foo | Error;
      `,
    );
    const responses = res.paths["/"].get.responses;
    ok(responses["200"]);
    ok(responses["200"].content);
    deepStrictEqual(responses["200"].content["application/json"].schema, {
      $ref: "#/components/schemas/Foo",
    });
    ok(responses["default"]);
    ok(responses["default"].content);
    deepStrictEqual(responses["default"].content["application/json"].schema, {
      $ref: "#/components/schemas/Error",
    });
  });

  it("defaults status code to default when model has @error decorator and explicit body", async () => {
    const res = await openApiFor(
      `
      @error
      model Error {
        @body body: string;
      }

      model Foo {
        foo: string;
      }

      @get op get(): Foo | Error;
      `,
    );
    const responses = res.paths["/"].get.responses;
    ok(responses["200"]);
    ok(responses["200"].content);
    deepStrictEqual(responses["200"].content["application/json"].schema, {
      $ref: "#/components/schemas/Foo",
    });
    ok(responses["default"]);
    ok(responses["default"].content);
    deepStrictEqual(responses["default"].content["application/json"].schema, {
      type: "string",
    });
  });

  it("uses explicit status code when model has @error decorator", async () => {
    const res = await openApiFor(
      `
      @error
      model Error {
        @statusCode _: "400";
        code: string;
      }

      model Foo {
        foo: string;
      }

      @get op get(): Foo | Error;
      `,
    );
    const responses = res.paths["/"].get.responses;
    ok(responses["200"]);
    ok(responses["200"].content);
    deepStrictEqual(responses["200"].content["application/json"].schema, {
      $ref: "#/components/schemas/Foo",
    });
    ok(responses["400"]);
    ok(responses["400"].content);
    deepStrictEqual(responses["400"].content["application/json"].schema, {
      $ref: "#/components/schemas/Error",
    });
    ok(responses["default"] === undefined);
  });

  it("defines body schema when explicit body has no content", async () => {
    const res = await openApiFor(
      `
      @delete op delete(): { @header date: string, @body body: {} };
      `,
    );
    const responses = res.paths["/"].delete.responses;
    ok(responses["204"] === undefined);
    ok(responses["200"]);
    ok(responses["200"].headers["date"]);
    ok(responses["200"].content["application/json"].schema);
  });

  it("return type with only statusCode should have specified status code and no content", async () => {
    const res = await openApiFor(`
      @get op create(): {@statusCode code: 201};
    `);

    const responses = res.paths["/"].get.responses;
    ok(responses["201"]);
    ok(responses["201"].content === undefined, "response should have no content");
    ok(responses["200"] === undefined);
    ok(responses["204"] === undefined);
  });

  it("defaults to 204 no content with void response type", async () => {
    const res = await openApiFor(`@get op read(): void;`);
    ok(res.paths["/"].get.responses["204"]);
  });

  it("defaults to 200 no content with void @body", async () => {
    const res = await openApiFor(`@get op read(): {@body body: void};`);
    ok(res.paths["/"].get.responses["200"]);
  });

  it("using @body ignore any metadata property underneath", async () => {
    const res = await openApiFor(`@get op read(): {
      @body body: {
        #suppress "@typespec/http/metadata-ignored"
        @header header: string,
        #suppress "@typespec/http/metadata-ignored"
        @query query: string,
        #suppress "@typespec/http/metadata-ignored"
        @statusCode code: 201,
      }
    };`);
    expect(res.paths["/"].get.responses["200"].content["application/json"].schema).toEqual({
      type: "object",
      properties: {
        header: { type: "string" },
        query: { type: "string" },
        code: { type: "number", enum: [201] },
      },
      required: ["header", "query", "code"],
    });
  });

  describe("response model resolving to no property in the body produce no body", () => {
    it.each(["{}", "{@header prop: string}", `{@visibility("none") prop: string}`])(
      "%s",
      async (body) => {
        const res = await openApiFor(`op test(): ${body};`);
        strictEqual(res.paths["/"].get.responses["200"].content, undefined);
      },
    );
  });

  it("property in body with only metadata properties should still be included", async () => {
    const res = await openApiFor(`op read(): {
        headers: {
          @header header1: string;
          @header header2: string;
        };
        name: string;
      };`);
    expect(res.paths["/"].get.responses["200"].content["application/json"].schema).toEqual({
      type: "object",
      properties: {
        headers: { type: "object" },
        name: { type: "string" },
      },
      required: ["headers", "name"],
    });
  });

  it("property in body with only metadata properties and @bodyIgnore should not be included", async () => {
    const res = await openApiFor(`op read(): {
        @bodyIgnore headers: {
          @header header1: string;
          @header header2: string;
        };
        name: string;
    };`);
    expect(res.paths["/"].get.responses["200"].content["application/json"].schema).toEqual({
      type: "object",
      properties: {
        name: { type: "string" },
      },
      required: ["name"],
    });
  });

  describe("multiple content types", () => {
    it("handles multiple content types for the same status code", async () => {
      const res = await openApiFor(
        `@get op read():
          | { @body body: {} }
          | {@header contentType: "text/plain", @body body: string };
        `,
      );
      ok(res.paths["/"].get.responses[200].content["application/json"]);
      ok(res.paths["/"].get.responses[200].content["text/plain"]);
    });

    it("merges headers from multiple responses", async () => {
      const res = await openApiFor(
        `@get op read():
          | { @body body: {}, @header foo: string }
          | {@header contentType: "text/plain", @body body: string, @header bar: string };
        `,
      );
      ok(res.paths["/"].get.responses[200].headers["foo"]);
      ok(res.paths["/"].get.responses[200].headers["bar"]);
    });

    it("issues a diagnostic for duplicate headers across responses", async () => {
      const diagnostics = await checkFor(
        `@get op read():
          | { @body body: {}, @header foo: string }
          | {@header contentType: "text/plain", @body body: string, @header foo: int16 };
        `,
      );
      expectDiagnostics(diagnostics, [{ code: "@typespec/openapi3/duplicate-header" }]);
    });

    it("issues no diagnostic when same response with headers as multiple content types", async () => {
      const diagnostics = await checkFor(
        `@get op read():
           {@header contentType: "text/plain" | "application/json", @body body: string, @header foo: string };
        `,
      );
      expectDiagnosticEmpty(diagnostics);
    });
  });

  describe("binary responses", () => {
    it("bytes responses should default to application/json with byte format", async () => {
      const res = await openApiFor(`
        @get op read(): bytes;
      `);

      const response = res.paths["/"].get.responses["200"];
      ok(response);
      ok(response.content);
      strictEqual(response.content["application/json"].schema.type, "string");
      strictEqual(response.content["application/json"].schema.format, "byte");
    });

    it("@body body: bytes responses default to application/json with bytes format", async () => {
      const res = await openApiFor(`
        @get op read(): {@body body: bytes};
      `);

      const response = res.paths["/"].get.responses["200"];
      ok(response);
      ok(response.content);
      strictEqual(response.content["application/json"].schema.type, "string");
      strictEqual(response.content["application/json"].schema.format, "byte");
    });

    it("@header contentType text/plain should keep format to byte", async () => {
      const res = await openApiFor(`
        @get op read(): {@header contentType: "text/plain", @body body: bytes};
      `);

      const response = res.paths["/"].get.responses["200"];
      ok(response);
      ok(response.content);
      strictEqual(response.content["text/plain"].schema.type, "string");
      strictEqual(response.content["text/plain"].schema.format, "byte");
    });

    it("@header contentType not json or text should set format to binary", async () => {
      const res = await openApiFor(`
        @get op read(): {@header contentType: "image/png", @body body: bytes};
      `);

      const response = res.paths["/"].get.responses["200"];
      ok(response);
      ok(response.content);
      strictEqual(response.content["image/png"].schema.type, "string");
      strictEqual(response.content["image/png"].schema.format, "binary");
    });
  });

  describe("multiple responses", () => {
    it("handles multiple response types for the same status code", async () => {
      const res = await openApiFor(`
        model A { x: 1 }
        model B { y: 1 }
        @route("/foo1") op foo1(): A | B ;
        `);
      const responses = res.paths["/foo1"].get.responses;
      deepStrictEqual(responses, {
        "200": {
          content: {
            "application/json": {
              schema: {
                anyOf: [
                  {
                    $ref: "#/components/schemas/A",
                  },
                  {
                    $ref: "#/components/schemas/B",
                  },
                ],
              },
            },
          },
          description: "The request has succeeded.",
        },
      });
    });

    it("only merges responses with the same status code", async () => {
      const res = await openApiFor(`
        model A { x: 1 }
        model B { y: 1 }
        model C { @statusCode code: 201; z: 1 }
        @route("/foo") op foo(): A | B | C ;
        `);
      const responses = res.paths["/foo"].get.responses;
      deepStrictEqual(responses, {
        "200": {
          content: {
            "application/json": {
              schema: {
                anyOf: [
                  {
                    $ref: "#/components/schemas/A",
                  },
                  {
                    $ref: "#/components/schemas/B",
                  },
                ],
              },
            },
          },
          description: "The request has succeeded.",
        },
        "201": {
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/C",
              },
            },
          },
          description: "The request has succeeded and a new resource has been created as a result.",
        },
      });
    });

    it("does not merge error responses", async () => {
      const res = await openApiFor(`
        model A { x: 1 }
        model B { y: 1 }
        @error model E { z: 1 }
        @route("/foo") op foo(): A | B | E;
        `);
      const responses = res.paths["/foo"].get.responses;
      deepStrictEqual(responses, {
        "200": {
          content: {
            "application/json": {
              schema: {
                anyOf: [
                  {
                    $ref: "#/components/schemas/A",
                  },
                  {
                    $ref: "#/components/schemas/B",
                  },
                ],
              },
            },
          },
          description: "The request has succeeded.",
        },
        default: {
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/E",
              },
            },
          },
          description: "An unexpected error response.",
        },
      });
    });
  });
});
