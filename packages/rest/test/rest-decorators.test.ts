import { expectDiagnostics, t } from "@typespec/compiler/testing";
import { ok, strictEqual } from "assert";
import { describe, it } from "vitest";
import { getResourceLocationType } from "../src/rest.js";
import { Tester } from "./test-host.js";

describe("rest: rest decorators", () => {
  describe("@resourceLocation", () => {
    it("emit diagnostic when used on non-model", async () => {
      const diagnostics = await Tester.diagnose(`
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
      const { WidgetLocation, program } = await Tester.compile(t.code`
        model Widget {};

        scalar ${t.scalar("WidgetLocation")} extends ResourceLocation<Widget>;
      `);

      const resourceType = getResourceLocationType(program, WidgetLocation.baseScalar!);
      ok(resourceType);
      strictEqual(resourceType!.name, "Widget");
    });
  });
});
