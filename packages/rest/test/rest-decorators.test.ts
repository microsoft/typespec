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
          message:
            "Cannot apply @resourceLocation decorator to test it is not assignable to Cadl.Reflection.Model",
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
