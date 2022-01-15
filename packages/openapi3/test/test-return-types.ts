import { deepStrictEqual, ok, strictEqual } from "assert";
import { checkFor, openApiFor } from "./testHost.js";

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
