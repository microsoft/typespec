import { BasicTestRunner, expectDiagnostics } from "@cadl-lang/compiler/testing";
import { ok, strictEqual } from "assert";
import {
  getHeaderFieldName,
  getPathParamName,
  getQueryParamName,
  isBody,
  isHeader,
  isPathParam,
  isQueryParam,
  isStatusCode,
} from "../src/http.js";
import { createRestTestRunner } from "./test-host.js";

describe("rest: http decorators", () => {
  let runner: BasicTestRunner;

  beforeEach(async () => {
    runner = await createRestTestRunner();
  });

  describe("emit diagnostic if passing arguments to verb decorators", () => {
    ["get", "post", "put", "patch", "delete", "head"].forEach((verb) => {
      it(`@${verb}`, async () => {
        const diagnostics = await runner.diagnose(`
          @${verb}("/test") op test(): string;
        `);

        expectDiagnostics(diagnostics, {
          code: "invalid-argument-count",
          message: "Expected 0 arguments, but got 1.",
        });
      });
    });
  });

  describe("@header", () => {
    it("emit diagnostics when @header is not used on model property", async () => {
      const diagnostics = await runner.diagnose(`
          @header op test(): string;

          @header model Foo {}
        `);

      expectDiagnostics(diagnostics, [
        {
          code: "decorator-wrong-target",
          message: "Cannot apply @header decorator to Operation",
        },
        {
          code: "decorator-wrong-target",
          message: "Cannot apply @header decorator to Model",
        },
      ]);
    });

    it("emit diagnostics when header name is not a string", async () => {
      const diagnostics = await runner.diagnose(`
          op test(@header(123) MyHeader: string): string;
        `);

      expectDiagnostics(diagnostics, {
        code: "invalid-argument",
        message: "Argument '123' of type 'Number' is not assignable to parameter of type 'String'",
      });
    });

    it("generate header name from property name", async () => {
      const { MyHeader } = await runner.compile(`
          op test(@test @header MyHeader: string): string;
        `);

      ok(isHeader(runner.program, MyHeader));
      strictEqual(getHeaderFieldName(runner.program, MyHeader), "my-header");
    });

    it("override header name with 1st parameter", async () => {
      const { MyHeader } = await runner.compile(`
          op test(@test @header("x-my-header") MyHeader: string): string;
        `);

      strictEqual(getHeaderFieldName(runner.program, MyHeader), "x-my-header");
    });
  });

  describe("@query", () => {
    it("emit diagnostics when @query is not used on model property", async () => {
      const diagnostics = await runner.diagnose(`
          @query op test(): string;

          @query model Foo {}
        `);

      expectDiagnostics(diagnostics, [
        {
          code: "decorator-wrong-target",
          message: "Cannot apply @query decorator to Operation",
        },
        {
          code: "decorator-wrong-target",
          message: "Cannot apply @query decorator to Model",
        },
      ]);
    });

    it("emit diagnostics when query name is not a string", async () => {
      const diagnostics = await runner.diagnose(`
          op test(@query(123) MyQuery: string): string;
        `);

      expectDiagnostics(diagnostics, {
        code: "invalid-argument",
        message: "Argument '123' of type 'Number' is not assignable to parameter of type 'String'",
      });
    });

    it("generate query name from property name", async () => {
      const { select } = await runner.compile(`
          op test(@test @query select: string): string;
        `);

      ok(isQueryParam(runner.program, select));
      strictEqual(getQueryParamName(runner.program, select), "select");
    });

    it("override query name with 1st parameter", async () => {
      const { select } = await runner.compile(`
          op test(@test @query("$select") select: string): string;
        `);

      strictEqual(getQueryParamName(runner.program, select), "$select");
    });
  });

  describe("@path", () => {
    it("emit diagnostics when @path is not used on model property", async () => {
      const diagnostics = await runner.diagnose(`
          @path op test(): string;

          @path model Foo {}
        `);

      expectDiagnostics(diagnostics, [
        {
          code: "decorator-wrong-target",
          message: "Cannot apply @path decorator to Operation",
        },
        {
          code: "decorator-wrong-target",
          message: "Cannot apply @path decorator to Model",
        },
      ]);
    });

    it("emit diagnostics when path name is not a string", async () => {
      const diagnostics = await runner.diagnose(`
          op test(@path(123) MyPath: string): string;
        `);

      expectDiagnostics(diagnostics, {
        code: "invalid-argument",
        message: "Argument '123' of type 'Number' is not assignable to parameter of type 'String'",
      });
    });

    it("generate path name from property name", async () => {
      const { select } = await runner.compile(`
          op test(@test @path select: string): string;
        `);

      ok(isPathParam(runner.program, select));
      strictEqual(getPathParamName(runner.program, select), "select");
    });

    it("override path name with 1st parameter", async () => {
      const { select } = await runner.compile(`
          op test(@test @path("$select") select: string): string;
        `);

      strictEqual(getPathParamName(runner.program, select), "$select");
    });
  });

  describe("@body", () => {
    it("emit diagnostics when @body is not used on model property", async () => {
      const diagnostics = await runner.diagnose(`
          @body op test(): string;

          @body model Foo {}
        `);

      expectDiagnostics(diagnostics, [
        {
          code: "decorator-wrong-target",
          message: "Cannot apply @body decorator to Operation",
        },
        {
          code: "decorator-wrong-target",
          message: "Cannot apply @body decorator to Model",
        },
      ]);
    });

    it("set the body with @body", async () => {
      const { body } = await runner.compile(`
          op test(@test @body body: string): string;
        `);

      ok(isBody(runner.program, body));
    });
  });

  describe("@statusCode", () => {
    it("emit diagnostics when @statusCode is not used on model property", async () => {
      const diagnostics = await runner.diagnose(`
          @statusCode op test(): string;

          @statusCode model Foo {}
        `);

      expectDiagnostics(diagnostics, [
        {
          code: "decorator-wrong-target",
          message: "Cannot apply @statusCode decorator to Operation",
        },
        {
          code: "decorator-wrong-target",
          message: "Cannot apply @statusCode decorator to Model",
        },
      ]);
    });

    it("set the statusCode with @statusCode", async () => {
      const { code } = await runner.compile(`
          op test(): {
            @test @statusCode code: 201
          };
        `);

      ok(isStatusCode(runner.program, code));
    });
  });
});
