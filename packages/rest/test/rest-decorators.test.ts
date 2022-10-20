import { Model } from "@cadl-lang/compiler";
import { BasicTestRunner, expectDiagnostics } from "@cadl-lang/compiler/testing";
import { ok, strictEqual } from "assert";
import { getResourceLocationType } from "../src/rest.js";
import { createRestTestRunner } from "./test-host.js";

describe("rest: rest decorators", () => {
  let runner: BasicTestRunner;

  beforeEach(async () => {
    runner = await createRestTestRunner();
  });

  describe("@resourceLocation", () => {
    // Depends on the separation between models and scalar https://github.com/microsoft/cadl/issues/1187
    it.skip("emit diagnostic when used on non-model", async () => {
      const diagnostics = await runner.diagnose(`
          model Widget {};

          @Cadl.Rest.Private.resourceLocation(Widget)
          op test(): string;

          model WidgetLocation is ResourceLocation<Widget>;
        `);

      expectDiagnostics(diagnostics, [
        {
          code: "decorator-wrong-target",
          message:
            "Cannot apply @resourceLocation decorator to test since it is not assignable to Cadl.object",
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
});
