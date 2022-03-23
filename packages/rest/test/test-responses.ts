import { expectDiagnostics } from "@cadl-lang/compiler/testing";
import { compileOperations } from "./test-host.js";

describe("cadl: rest: responses", () => {
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
    expectDiagnostics(diagnostics, [{ code: "@cadl-lang/rest/duplicate-body" }]);
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
      code: "@cadl-lang/rest/duplicate-response",
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
      { code: "@cadl-lang/rest/content-type-string" },
      { code: "@cadl-lang/rest/content-type-string" },
      { code: "@cadl-lang/rest/content-type-string" },
    ]);
  });
});
