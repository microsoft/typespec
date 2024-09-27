import { Model } from "@typespec/compiler";
import { expectDiagnosticEmpty, expectDiagnostics } from "@typespec/compiler/testing";
import { deepStrictEqual, ok, strictEqual } from "assert";
import { describe, it } from "vitest";
import { compileOperations, getOperationsWithServiceNamespace } from "./test-host.js";

describe("body resolution", () => {
  it("emit diagnostics for duplicate @body decorator", async () => {
    const [_, diagnostics] = await compileOperations(
      `op read(): { @body body1: string, @body body2: int32 };`,
    );
    expectDiagnostics(diagnostics, [
      { code: "@typespec/http/duplicate-body" },
      { code: "@typespec/http/duplicate-body" },
    ]);
  });

  it("emit diagnostics for duplicate @bodyRoot decorator", async () => {
    const [_, diagnostics] = await compileOperations(
      `op read(): { @bodyRoot body1: string, @bodyRoot body2: int32 };`,
    );
    expectDiagnostics(diagnostics, [
      { code: "@typespec/http/duplicate-body" },
      { code: "@typespec/http/duplicate-body" },
    ]);
  });

  it("emit diagnostics for using @body and @bodyRoute decorator", async () => {
    const [_, diagnostics] = await compileOperations(
      `op read(): { @bodyRoot body1: string, @body body2: int32 };`,
    );
    expectDiagnostics(diagnostics, [
      { code: "@typespec/http/duplicate-body" },
      { code: "@typespec/http/duplicate-body" },
    ]);
  });

  it("allows a deeply nested @body", async () => {
    const [_, diagnostics] = await compileOperations(`
        op get(): {data: {nested: { @body param2: string }}};
      `);

    expectDiagnosticEmpty(diagnostics);
  });

  it("allows a deeply nested @bodyRoot", async () => {
    const [_, diagnostics] = await compileOperations(`
        op get(): {data: {nested: { @bodyRoot param2: string }}};
      `);

    expectDiagnosticEmpty(diagnostics);
  });

  describe("emit diagnostics when using metadata decorator in @body", () => {
    it.each([
      ["@header", "id: string"],
      ["@statusCode", "_: 200"],
    ])("%s", async (dec, prop) => {
      const [_, diagnostics] = await compileOperations(
        `op read(): { @body explicit: {${dec} ${prop}, other: string} };`,
      );
      expectDiagnostics(diagnostics, { code: "@typespec/http/metadata-ignored" });
    });
  });
});

it("doesn't emit diagnostic if the metadata is not applicable in the response", async () => {
  const [_, diagnostics] = await compileOperations(
    `op read(): { @body explicit: {@path id: string} };`,
  );
  expectDiagnosticEmpty(diagnostics);
});

it("issues diagnostics for invalid content types", async () => {
  const [_, diagnostics] = await compileOperations(
    `
      model Foo {
        foo: string;
      }

      model TextPlain {
        contentType: "text/plain";
      }

      @route("/test1")
      @get
      op test1(): { @header contentType: int32, @body body: Foo };
      @route("/test2")
      @get
      op test2(): { @header contentType: 42, @body body: Foo };
      @route("/test3")
      @get
      op test3(): { @header contentType: "application/json" | TextPlain, @body body: Foo };
    `,
  );
  expectDiagnostics(diagnostics, [
    { code: "@typespec/http/content-type-string" },
    { code: "@typespec/http/content-type-string" },
    { code: "@typespec/http/content-type-string" },
  ]);
});

it("supports any casing for string literal 'Content-Type' header properties.", async () => {
  const [routes, diagnostics] = await getOperationsWithServiceNamespace(
    `
      model Foo {}

      @route("/test1")
      op test1(): { @header "content-Type": "text/html", @body body: Foo };

      @route("/test2")
      op test2(): { @header "CONTENT-type": "text/plain", @body body: Foo };

      @route("/test3")
      op test3(): { @header "content-type": "application/json", @body body: Foo };
    `,
  );
  expectDiagnosticEmpty(diagnostics);
  strictEqual(routes.length, 3);
  deepStrictEqual(routes[0].responses[0].responses[0].body?.contentTypes, ["text/html"]);
  deepStrictEqual(routes[1].responses[0].responses[0].body?.contentTypes, ["text/plain"]);
  deepStrictEqual(routes[2].responses[0].responses[0].body?.contentTypes, ["application/json"]);
});

// Regression test for https://github.com/microsoft/typespec/issues/328
it("empty response model becomes body if it has children", async () => {
  const [routes, diagnostics] = await getOperationsWithServiceNamespace(
    `
      op read(): A;

      @discriminator("foo")
      model A {}

      model B extends A {
        foo: "B";
        b: string;
      }

      model C extends A {
        foo: "C";
        c: string;
      }

    `,
  );
  expectDiagnosticEmpty(diagnostics);
  strictEqual(routes.length, 1);
  const responses = routes[0].responses;
  strictEqual(responses.length, 1);
  const response = responses[0];
  const body = response.responses[0].body;
  ok(body);
  strictEqual((body.type as Model).name, "A");
});
