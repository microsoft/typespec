import { Scalar } from "@typespec/compiler";
import { BasicTestRunner, expectDiagnostics } from "@typespec/compiler/testing";
import { ok, strictEqual } from "assert";
import { beforeEach, describe, it } from "vitest";
import { getResourceLocationType } from "../src/rest.js";
import { createRestTestRunner } from "./test-host.js";

describe("rest: rest decorators", () => {
  let runner: BasicTestRunner;

  beforeEach(async () => {
    runner = await createRestTestRunner();
  });

  describe("@resourceLocation", () => {
    it("emit diagnostic when used on non-model", async () => {
      const diagnostics = await runner.diagnose(`
          model Widget {};

          @TypeSpec.Rest.Private.resourceLocation(Widget)
          op test(): string;

          scalar WidgetLocation extends ResourceLocation<Widget>;
        `);

      expectDiagnostics(diagnostics, [
        {
          code: "decorator-wrong-target",
          message:
            "Cannot apply @resourceLocation decorator to test since it is not assignable to string",
        },
      ]);
    });

    it("marks a model type as a resource location for a specific type", async () => {
      const { WidgetLocation } = (await runner.compile(`
          model Widget {};

          @test
          scalar WidgetLocation extends ResourceLocation<Widget>;
`)) as { WidgetLocation: Scalar };

      const resourceType = getResourceLocationType(runner.program, WidgetLocation.baseScalar!);
      ok(resourceType);
      strictEqual(resourceType!.name, "Widget");
    });
  });
});
