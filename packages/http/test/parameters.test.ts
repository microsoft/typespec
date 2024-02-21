import { expectDiagnosticEmpty, expectDiagnostics } from "@typespec/compiler/testing";
import { deepStrictEqual } from "assert";
import { describe, it } from "vitest";
import { compileOperations } from "./test-host.js";

it("emit diagnostic for parameters with multiple http request annotations", async () => {
  const [_, diagnostics] = await compileOperations(`
      @get op get(@body body: string, @path @query multiParam: string): string;
    `);

  expectDiagnostics(diagnostics, {
    code: "@typespec/http/operation-param-duplicate-type",
    message: "Param multiParam has multiple types: [query, path]",
  });
});

it("emit diagnostic when there is an unannotated parameter and a @body param", async () => {
  const [_, diagnostics] = await compileOperations(`
      @get op get(param1: string, @body param2: string): string;
    `);

  expectDiagnostics(diagnostics, {
    code: "@typespec/http/duplicate-body",
    message:
      "Operation has a @body and an unannotated parameter. There can only be one representing the body",
  });
});

it("emit diagnostic when there are multiple @body param", async () => {
  const [_, diagnostics] = await compileOperations(`
      @get op get(@query select: string, @body param1: string, @body param2: string): string;
    `);

  expectDiagnostics(diagnostics, {
    code: "@typespec/http/duplicate-body",
    message: "Operation has multiple @body parameters declared",
  });
});

it("emit error if using multipart/form-data contentType parameter with a body not being a model", async () => {
  const [_, diagnostics] = await compileOperations(`
      @get op get(@header contentType: "multipart/form-data", @body body: string | int32): string;
    `);

  expectDiagnostics(diagnostics, {
    code: "@typespec/http/multipart-model",
    message: "Multipart request body must be a model.",
  });
});

it("emit warning if using contentType parameter without a body", async () => {
  const [_, diagnostics] = await compileOperations(`
      
      @get op get(@header contentType: "image/png"): string;
    `);

  expectDiagnostics(diagnostics, {
    code: "@typespec/http/content-type-ignored",
    message: "`Content-Type` header ignored because there is no body.",
  });
});

it("resolve body when defined with @body", async () => {
  const [routes, diagnostics] = await compileOperations(`
      @get op get(@query select: string, @body bodyParam: string): string;
    `);

  expectDiagnosticEmpty(diagnostics);
  deepStrictEqual(routes, [
    {
      verb: "get",
      path: "/",
      params: { params: [{ type: "query", name: "select" }], body: "bodyParam" },
    },
  ]);
});

it("resolves single unannotated parameter as request body", async () => {
  const [routes, diagnostics] = await compileOperations(`
      @get op get(@query select: string, unannotatedBodyParam: string): string;
    `);

  expectDiagnosticEmpty(diagnostics);
  deepStrictEqual(routes, [
    {
      verb: "get",
      path: "/",
      params: {
        params: [{ type: "query", name: "select" }],
        body: ["unannotatedBodyParam"],
      },
    },
  ]);
});

it("resolves multiple unannotated parameters as request body", async () => {
  const [routes, diagnostics] = await compileOperations(`
      @get op get(
        @query select: string,
        unannotatedBodyParam1: string,
        unannotatedBodyParam2: string): string;
    `);

  expectDiagnosticEmpty(diagnostics);
  deepStrictEqual(routes, [
    {
      verb: "get",
      path: "/",
      params: {
        params: [{ type: "query", name: "select" }],
        body: ["unannotatedBodyParam1", "unannotatedBodyParam2"],
      },
    },
  ]);
});

it("resolves unannotated path parameters that are included in the route path", async () => {
  const [routes, diagnostics] = await compileOperations(`
      @route("/test/{name}/sub/{foo}")
      @get op get(
        name: string,
        foo: string
      ): string;

      @route("/nested/{name}")
      namespace A {
        @route("sub")
        namespace B {
          @route("{bar}")
          @get op get(
            name: string,
            bar: string
          ): string;
        }
      }
    `);

  expectDiagnosticEmpty(diagnostics);
  deepStrictEqual(routes, [
    {
      verb: "get",
      path: "/test/{name}/sub/{foo}",
      params: {
        params: [
          { type: "path", name: "name" },
          { type: "path", name: "foo" },
        ],
        body: undefined,
      },
    },
    {
      verb: "get",
      path: "/nested/{name}/sub/{bar}",
      params: {
        params: [
          { type: "path", name: "name" },
          { type: "path", name: "bar" },
        ],
        body: undefined,
      },
    },
  ]);
});

describe("emit diagnostics when using metadata decorator in @body", () => {
  it.each([
    ["@header", "id: string"],
    ["@query", "id: string"],
    ["@statusCode", "_: 200"],
  ])("%s", async (dec, prop) => {
    const [_, diagnostics] = await compileOperations(
      `op read(@body explicit: {${dec} ${prop}, other: string}): void;`
    );
    expectDiagnostics(diagnostics, { code: "@typespec/http/metadata-ignored" });
  });
});
