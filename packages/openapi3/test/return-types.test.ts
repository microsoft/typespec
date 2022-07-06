import { expectDiagnosticEmpty, expectDiagnostics } from "@cadl-lang/compiler/testing";
import { deepStrictEqual, ok, strictEqual } from "assert";
import { checkFor, openApiFor } from "./test-host.js";

describe("openapi3: return types", () => {
  it("defines responses with response headers", async () => {
    const res = await openApiFor(
      `
      model ETagHeader {
        @header eTag: string;
      }
      model Key {
        key: string;
      }
      @route("/")
      namespace root {
        @get()
        op read(): Key & ETagHeader;
      }
      `
    );
    ok(res.paths["/"].get.responses["200"].headers);
    ok(res.paths["/"].get.responses["200"].headers["e-tag"]);
  });

  it("defines responses with status codes", async () => {
    const res = await openApiFor(
      `
      model CreatedResponse {
        @statusCode code: "201";
      }
      model Key {
        key: string;
      }
      @route("/")
      namespace root {
        @put
        op create(): CreatedResponse & Key;
      }
      `
    );
    ok(res.paths["/"].put.responses["201"]);
    ok(res.paths["/"].put.responses["201"].content["application/json"].schema);
  });

  it("defines responses with numeric status codes", async () => {
    const res = await openApiFor(
      `
      model CreatedResponse {
        @statusCode code: 201;
      }
      model Key {
        key: string;
      }
      @route("/")
      namespace root {
        @put
        op create(): CreatedResponse & Key;
      }
      `
    );
    ok(res.paths["/"].put.responses["201"]);
    ok(res.paths["/"].put.responses["201"].content["application/json"].schema);
  });

  it("defines responses with headers and status codes", async () => {
    const res = await openApiFor(
      `
      model ETagHeader {
        @header eTag: string;
      }
      model CreatedResponse {
        @statusCode code: "201";
      }
      model Key {
        key: string;
      }
      @route("/")
      namespace root {
        @put
        op create(): { ...CreatedResponse, ...ETagHeader, @body body: Key};
      }
      `
    );
    ok(res.paths["/"].put.responses["201"]);
    ok(res.paths["/"].put.responses["201"].headers["e-tag"]);
    deepStrictEqual(res.paths["/"].put.responses["201"].content["application/json"].schema, {
      $ref: "#/components/schemas/Key",
    });
  });

  it("defines responses with headers and status codes in base model", async () => {
    const res = await openApiFor(
      `
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
      @route("/")
      namespace root {
        @put
        op create(): CreatePageResponse;
      }
      `
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
        @header date: zonedDateTime;
      }
      model Key {
        key: string;
      }
      @route("/")
      namespace root {
        @put
        op create(): CreatedOrUpdatedResponse & DateHeader & Key;
      }
      `
    );
    ok(res.paths["/"].put.responses["200"]);
    ok(res.paths["/"].put.responses["201"]);
    // Note: 200 and 201 response should be equal except for description
    deepStrictEqual(
      res.paths["/"].put.responses["200"].headers,
      res.paths["/"].put.responses["201"].headers
    );
    deepStrictEqual(
      res.paths["/"].put.responses["200"].content,
      res.paths["/"].put.responses["201"].content
    );
  });

  it("defines separate responses for each status code property in return type", async () => {
    const res = await openApiFor(
      `
      model CreatedOrUpdatedResponse {
        @statusCode ok: "200";
        @statusCode created: "201";
      }
      model DateHeader {
        @header date: zonedDateTime;
      }
      model Key {
        key: string;
      }
      @route("/")
      namespace root {
        @put
        op create(): CreatedOrUpdatedResponse & DateHeader & Key;
      }
      `
    );
    ok(res.paths["/"].put.responses["200"]);
    ok(res.paths["/"].put.responses["201"]);
    // Note: 200 and 201 response should be equal except for description
    deepStrictEqual(
      res.paths["/"].put.responses["200"].headers,
      res.paths["/"].put.responses["201"].headers
    );
    deepStrictEqual(
      res.paths["/"].put.responses["200"].content,
      res.paths["/"].put.responses["201"].content
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
      @route("/")
      namespace root {
        @get
        op read(): Key | Error;
      }
      `
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
      @route("/")
      namespace root {
        @get
        // Note: & takes precedence over |
        op read(): Key & TextPlain | Error;
      }
      `
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
      @route("/")
      namespace root {
        @get
        op read(): { ...TextMulti, @body body: string };
      }
    `
    );
    ok(res.paths["/"].get.responses["200"]);
    ok(res.paths["/"].get.responses["200"].content["text/plain"]);
    ok(res.paths["/"].get.responses["200"].content["text/html"]);
    ok(res.paths["/"].get.responses["200"].content["text/csv"]);
  });

  it("issues diagnostics for invalid status codes", async () => {
    const diagnostics = await checkFor(
      `
      model Foo {
        foo: string;
      }

      model BadRequest {
        code: "4XX";
      }

      namespace root {
        @route("/test1")
        @get
        op test1(): { @statusCode code: string, @body body: Foo };
        @route("/test2")
        @get
        op test2(): { @statusCode code: "Ok", @body body: Foo };
        @route("/test3")
        @get
        op test3(): { @statusCode code: "200" | BadRequest, @body body: Foo };
      }
    `
    );
    expectDiagnostics(diagnostics, [
      { code: "@cadl-lang/rest/status-code-invalid" },
      { code: "@cadl-lang/rest/status-code-invalid" },
      { code: "@cadl-lang/rest/status-code-invalid" },
    ]);
    ok(diagnostics[0].message.includes("must be a numeric or string literal"));
    ok(diagnostics[1].message.includes("must be a three digit code between 100 and 599"));
    ok(diagnostics[2].message.includes("must be a numeric or string literal"));
  });

  it("defines responses with primitive types", async () => {
    const res = await openApiFor(
      `
      @route("/")
      namespace root {
        @get()
        op read(): string;
      }
      `
    );
    ok(res.paths["/"].get.responses["200"]);
    ok(res.paths["/"].get.responses["200"].content);
    strictEqual(
      res.paths["/"].get.responses["200"].content["application/json"].schema.type,
      "string"
    );
  });

  it("defines responses with top-level array type", async () => {
    const res = await openApiFor(
      `
      model Foo {
        foo: string;
      }
      @route("/")
      namespace root {
        @get()
        op read(): Foo[];
      }
      `
    );
    ok(res.paths["/"].get.responses["200"]);
    ok(res.paths["/"].get.responses["200"].content);
    strictEqual(
      res.paths["/"].get.responses["200"].content["application/json"].schema.type,
      "array"
    );
  });

  it("return type with no properties should be 204 response w/ no content", async () => {
    const res = await openApiFor(
      `
      @route("/")
      namespace root {
        @get op delete(): {};
      }
      `
    );

    const responses = res.paths["/"].get.responses;
    ok(responses["204"]);
    ok(responses["204"].content === undefined, "response should have no content");
    ok(responses["200"] === undefined);
  });

  it("return type with only response metadata should be 204 response w/ no content", async () => {
    const res = await openApiFor(
      `
      @route("/")
      namespace root {
        @get op delete(): {@header date: string};
      }
      `
    );

    const responses = res.paths["/"].get.responses;
    ok(responses["204"]);
    ok(responses["204"].content === undefined, "response should have no content");
    ok(responses["200"] === undefined);
  });

  it("defaults status code to 204 when implicit body has no content", async () => {
    const res = await openApiFor(
      `
      @route("/")
      namespace root {
        @delete
        op delete(): { @header date: string };
      }
      `
    );
    const responses = res.paths["/"].delete.responses;
    ok(responses["200"] === undefined);
    ok(responses["204"]);
    ok(responses["204"].headers["date"]);
    ok(responses["204"].content === undefined);
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

      @route("/")
      namespace root {
        @get
        op get(): Foo | Error;
      }
      `
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

      @route("/")
      namespace root {
        @get
        op get(): Foo | Error;
      }
      `
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

      @route("/")
      namespace root {
        @get
        op get(): Foo | Error;
      }
      `
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
      @route("/")
      namespace root {
        @delete
        op delete(): { @header date: string, @body body: {} };
      }
      `
    );
    const responses = res.paths["/"].delete.responses;
    ok(responses["204"] === undefined);
    ok(responses["200"]);
    ok(responses["200"].headers["date"]);
    ok(responses["200"].content["application/json"].schema);
  });

  it("return type with only statusCode should have specified status code and no content", async () => {
    const res = await openApiFor(
      `
      @route("/")
      namespace root {
        @get op create(): {@statusCode code: 201};
      }
      `
    );

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

  it("defaults to 204 no content with void @body", async () => {
    const res = await openApiFor(`@get op read(): {@body body: void};`);
    ok(res.paths["/"].get.responses["204"]);
  });

  describe("multiple content types", () => {
    it("handles multiple content types for the same status code", async () => {
      const res = await openApiFor(
        `@get op read():
          | { @body body: {} }
          | {@header contentType: "text/plain", @body body: string };
        `
      );
      ok(res.paths["/"].get.responses[200].content["application/json"]);
      ok(res.paths["/"].get.responses[200].content["text/plain"]);
    });

    it("merges headers from multiple responses", async () => {
      const res = await openApiFor(
        `@get op read():
          | { @body body: {}, @header foo: string }
          | {@header contentType: "text/plain", @body body: string, @header bar: string };
        `
      );
      ok(res.paths["/"].get.responses[200].headers["foo"]);
      ok(res.paths["/"].get.responses[200].headers["bar"]);
    });

    it("issues a diagnostic for duplicate headers across responses", async () => {
      const diagnostics = await checkFor(
        `@get op read():
          | { @body body: {}, @header foo: string }
          | {@header contentType: "text/plain", @body body: string, @header foo: string };
        `
      );
      expectDiagnostics(diagnostics, [{ code: "@cadl-lang/openapi3/duplicate-header" }]);
    });

    it("issues no diagnostic when same response with headers as multiple content types", async () => {
      const diagnostics = await checkFor(
        `@get op read():
           {@header contentType: "text/plain" | "application/json", @body body: string, @header foo: string };
        `
      );
      expectDiagnosticEmpty(diagnostics);
    });
  });

  describe("binary responses", () => {
    it("bytes responses should default to application/json with byte format", async () => {
      const res = await openApiFor(
        `
      @route("/")
      namespace root {
        @get op read(): bytes;
      }
      `
      );

      const response = res.paths["/"].get.responses["200"];
      ok(response);
      ok(response.content);
      strictEqual(response.content["application/json"].schema.type, "string");
      strictEqual(response.content["application/json"].schema.format, "byte");
    });

    it("@body body: bytes responses default to application/json with bytes format", async () => {
      const res = await openApiFor(
        `
      @route("/")
      namespace root {
        @get op read(): {@body body: bytes};
      }
      `
      );

      const response = res.paths["/"].get.responses["200"];
      ok(response);
      ok(response.content);
      strictEqual(response.content["application/json"].schema.type, "string");
      strictEqual(response.content["application/json"].schema.format, "byte");
    });

    it("@header contentType text/plain should keep format to byte", async () => {
      const res = await openApiFor(
        `
      @route("/")
      namespace root {
        @get op read(): {@header contentType: "text/plain", @body body: bytes};
      }
      `
      );

      const response = res.paths["/"].get.responses["200"];
      ok(response);
      ok(response.content);
      strictEqual(response.content["text/plain"].schema.type, "string");
      strictEqual(response.content["text/plain"].schema.format, "byte");
    });

    it("@header contentType not json or text should set format to binary", async () => {
      const res = await openApiFor(
        `
      @route("/")
      namespace root {
        @get op read(): {@header contentType: "image/png", @body body: bytes};
      }
      `
      );

      const response = res.paths["/"].get.responses["200"];
      ok(response);
      ok(response.content);
      strictEqual(response.content["image/png"].schema.type, "string");
      strictEqual(response.content["image/png"].schema.format, "binary");
    });
  });
});
