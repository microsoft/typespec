import { Model } from "@cadl-lang/compiler";
import { BasicTestRunner, expectDiagnostics } from "@cadl-lang/compiler/testing";
import { ok, strictEqual } from "assert";
import { getResourceLocationType } from "../src/rest.js";
import { createRestTestRunner } from "./test-host.js";

describe("rest: http decorators", () => {
  let runner: BasicTestRunner;

  beforeEach(async () => {
    runner = await createRestTestRunner();
  });

  describe("@resourceLocation", () => {
    it("emit diagnostic when used on non-model", async () => {
      const diagnostics = await runner.diagnose(`
          model Widget {};

          @Cadl.Rest.Private.resourceLocation(Widget)
          op test(): string;

          model WidgetLocation is ResourceLocation<Widget>;
        `);

      expectDiagnostics(diagnostics, [
        {
          code: "decorator-wrong-target",
          message: "Cannot apply @resourceLocation decorator to Operation",
        },
      ]);
    });

    it("marks a model type as a resource location for a specific type", async () => {
      const { WidgetLocation } = (await runner.compile(`
          model Widget {};

          @test
          model WidgetLocation is ResourceLocation<Widget>;
`)) as { WidgetLocation: Model };

      const resourceType = getResourceLocationType(runner.program, WidgetLocation);
      ok(resourceType);
      strictEqual(resourceType!.name, "Widget");
    });
  });

  describe("@discriminator on unions", () => {
    it("requires variants to be models", async () => {
      const diagnostics = await runner.diagnose(`
        @discriminator("kind")
        union Foo {
          a: "hi"
        }
      `);

      expectDiagnostics(diagnostics, [
        {
          code: "@cadl-lang/rest/invalid-discriminated-union-variant",
          message: "Union variant a must be a model type",
        },
      ]);
    });
    it("requires variants to have the discriminator property", async () => {
      const diagnostics = await runner.diagnose(`
        model A {

        }
        @discriminator("kind")
        union Foo {
          a: A
        }
      `);

      expectDiagnostics(diagnostics, [
        {
          code: "@cadl-lang/rest/invalid-discriminated-union-variant",
          message: "Variant a's type is missing the discriminant property kind",
        },
      ]);
    });

    it("requires variant discriminator properties to be string literals or string enum values", async () => {
      const diagnostics = await runner.diagnose(`
        model A {
          kind: string,
        }

        @discriminator("kind")
        union Foo {
          a: A
        }
      `);

      expectDiagnostics(diagnostics, [
        {
          code: "@cadl-lang/rest/invalid-discriminated-union-variant",
          message:
            "Variant a's type's discriminant property kind must be a string literal or string enum member",
        },
      ]);
    });
  });
});
