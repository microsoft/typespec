import { expectDiagnostics } from "@cadl-lang/compiler/testing";
import { compileOperations } from "./test-host.js";

describe("cadl: rest: responses", () => {
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
