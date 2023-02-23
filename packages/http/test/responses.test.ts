import { Model } from "@typespec/compiler";
import { expectDiagnosticEmpty, expectDiagnostics } from "@typespec/compiler/testing";
import { deepStrictEqual, ok, strictEqual } from "assert";
import { compileOperations, getOperationsWithServiceNamespace } from "./test-host.js";

describe("http: responses", () => {
  it("issues diagnostics for duplicate body decorator", async () => {
    const [_, diagnostics] = await compileOperations(
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
    expectDiagnostics(diagnostics, [{ code: "@typespec/http/duplicate-body" }]);
  });

  it("issues diagnostics for return type with duplicate status code", async () => {
    const [_, diagnostics] = await compileOperations(
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
    expectDiagnostics(diagnostics, {
      code: "@typespec/http/duplicate-response",
      message: "Multiple return types for content type application/json and status code 200",
    });
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

      @test
      namespace Test {
        @route("/test1")
        @get
        op test1(): { @header "content-Type": "text/html", @body body: Foo };

        @route("/test2")
        @get
        op test2(): { @header "CONTENT-type": "text/plain", @body body: Foo };

        @route("/test3")
        @get
        op test3(): { @header "content-type": "application/json", @body body: Foo };
      }
    `
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
      @route("/") op read(): A;

      model A {}

      model B extends A {
        foo: "B";
        b: string;
      }

      model C extends A {
        foo: "C";
        c: string;
      }

    `
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
});
