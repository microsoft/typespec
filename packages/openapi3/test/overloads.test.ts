import { deepStrictEqual, ok, strictEqual } from "assert";
import { OpenAPI3Document } from "../src/types.js";
import { openApiFor } from "./test-host.js";

describe("openapi3: overloads", () => {
  context("overloads use same endpoint", () => {
    let res: OpenAPI3Document;
    beforeEach(async () => {
      res = await openApiFor(
        `
        @route("/upload")
        op upload(data: string | bytes, @header contentType: "text/plain" | "application/octet-stream"): void;
        @overload(upload)
        op uploadString(data: string, @header contentType: "text/plain" ): void;
        @overload(upload)
        op uploadBytes(data: bytes, @header contentType: "application/octet-stream"): void;
      `
      );
    });

    it("should create a single path using the overload base name", async () => {
      strictEqual(Object.keys(res.paths).length, 1);
      const operation = res.paths["/upload"].post;
      ok(operation);
      strictEqual(operation.operationId, "upload");
      deepStrictEqual(Object.keys(operation.requestBody.content), [
        "text/plain",
        "application/octet-stream",
      ]);
    });
  });

  context("overloads all use different endpoint", () => {
    let res: OpenAPI3Document;
    beforeEach(async () => {
      res = await openApiFor(
        `
        @route("/upload")
        op upload(data: string | bytes, @header contentType: "text/plain" | "application/octet-stream"): void;
        @overload(upload)
        @route("/uploadString")
        op uploadString(data: string, @header contentType: "text/plain" ): void;
        @overload(upload)
        @route("/uploadBytes")
        op uploadBytes(data: bytes, @header contentType: "application/octet-stream"): void;
      `
      );
    });

    it("should create an endpoint for each overload", () => {
      const stringOperation = res.paths["/uploadString"].post;
      const bytesOperation = res.paths["/uploadBytes"].post;
      ok(stringOperation);
      ok(bytesOperation);
      strictEqual(stringOperation.operationId, "uploadString");
      strictEqual(bytesOperation.operationId, "uploadBytes");

      deepStrictEqual(Object.keys(stringOperation.requestBody.content), ["text/plain"]);
      deepStrictEqual(Object.keys(bytesOperation.requestBody.content), [
        "application/octet-stream",
      ]);
    });

    it("should still create endpoint for operation overload base", async () => {
      const baseOperation = res.paths["/upload"].post;
      ok(baseOperation);
      strictEqual(baseOperation.operationId, "upload");

      deepStrictEqual(Object.keys(baseOperation.requestBody.content), [
        "text/plain",
        "application/octet-stream",
      ]);
    });
  });

  context("some overload all use different endpoint", () => {
    let res: OpenAPI3Document;
    beforeEach(async () => {
      res = await openApiFor(
        `
        @route("/upload")
        op upload(data: string | bytes, @header contentType: "text/plain" | "application/octet-stream"): void;
        @overload(upload)
        @route("/uploadString")
        op uploadString(data: string, @header contentType: "text/plain" ): void;
        @overload(upload)
        op uploadBytes(data: bytes, @header contentType: "application/octet-stream"): void;
      `
      );
    });

    it("should only create an endpoint for overloads with a different route", () => {
      strictEqual(Object.keys(res.paths).length, 2);
      ok(res.paths["/upload"].post);
      ok(res.paths["/uploadString"].post);
    });
  });
});
