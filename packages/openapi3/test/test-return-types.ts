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

  it("defines responses with status code range", async () => {
    const res = await openApiFor(
      `
      model SuccessResponse {
        @statusCode _: "2XX";
      }
      model BadRequestResponse {
        @statusCode _: "4XX";
        code: string
      }
      model Key {
        key: string;
      }
      @route("/")
      namespace root {
        @put
        op create(): SuccessResponse & Key | BadRequestResponse;
      }
      `
    );
    const responses = res.paths["/"].put.responses;
    ok(responses["2XX"]);
    ok(responses["4XX"]);
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
      model Error {
        @statusCode _: "default";
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
      model Error {
        @statusCode _: "default";
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

  it("returns diagnostics for duplicate body decorator", async () => {
    const diagnostics = await checkFor(
      `
      model Foo {
        foo: string;
      }
      model Bar {
        bar: string;
      }
      @route("/")
      namespace root {
        @get
        op read(): { @body body1: Foo, @body body2: Bar };
      }
      `
    );
    strictEqual(diagnostics.length, 1);
    strictEqual(diagnostics[0].code, "@cadl-lang/openapi3/duplicate-body");
    strictEqual(diagnostics[0].message, "Duplicate @body declarations on response type");
  });

  it("issues diagnostics for return type with duplicate status code", async () => {
    const diagnostics = await checkFor(
      `
    model Foo {
      foo: string;
    }
    model Error {
      code: string;
    }
    @route("/")
    namespace root {
      @get
      op read(): Foo | Error;
    }
    `
    );
    strictEqual(diagnostics.length, 1);
    strictEqual(diagnostics[0].code, "@cadl-lang/openapi3/duplicate-response");
    strictEqual(diagnostics[0].message, "Multiple return types for status code 200");
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
    strictEqual(diagnostics.length, 3);
    ok(diagnostics.every((e) => e.code === "@cadl-lang/openapi3/status-code-invalid"));
    ok(diagnostics[0].message.includes("must be a numeric or string literal"));
    ok(
      diagnostics[1].message.includes(
        "must be a specific code between 100 and 599, or nXX, or default"
      )
    );
    ok(diagnostics[2].message.includes("must be a numeric or string literal"));
  });

  it("issues diagnostics for invalid content types", async () => {
    const diagnostics = await checkFor(
      `
      model Foo {
        foo: string;
      }

      model TextPlain {
        contentType: "text/plain";
      }

      namespace root {
        @route("/test1")
        @get
        op test1(): { @header contentType: string, @body body: Foo };
        @route("/test2")
        @get
        op test2(): { @header contentType: 42, @body body: Foo };
        @route("/test3")
        @get
        op test3(): { @header contentType: "application/json" | TextPlain, @body body: Foo };
      }
    `
    );
    strictEqual(diagnostics.length, 3);
    ok(diagnostics.every((e) => e.code === "@cadl-lang/openapi3/content-type-string"));
    ok(
      diagnostics.every((e) =>
        e.message.includes("must be a string literal or union of string literals")
      )
    );
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
