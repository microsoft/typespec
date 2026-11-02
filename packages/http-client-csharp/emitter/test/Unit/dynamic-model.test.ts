import { expectDiagnosticEmpty } from "@typespec/compiler/testing";
import { deepStrictEqual, ok } from "assert";
import { describe, it } from "vitest";
import { createModel } from "../../src/lib/client-model-builder.js";
import { defaultOptions } from "../../src/options.js";
import {
  createCSharpSdkContext,
  createEmitterContext,
  createEmitterTestHost,
  typeSpecCompile,
} from "./utils/test-util.js";

describe("Test dynamicModel decorator", () => {
  describe.each(["model", "namespace"])("on a %s", (target) => {
    it.each(["csharp", "csharp, python", "python"])(
      "consumes TCGC metadata scoped to %s",
      async (scope) => {
        const host = await createEmitterTestHost();
        const decorator = `${scope === "python" ? '#suppress "@azure-tools/typespec-client-generator-core/decorator-requires-scope" "Testing scope filtering"\n' : ""}@dynamicModel("${scope}")`;
        const program = await typeSpecCompile(
          `
          ${target === "namespace" ? decorator : ""}
          namespace Pets {
            ${target === "model" ? decorator : ""}
            model Pet { name: string; }
          }
          model Owner { pet: Pets.Pet; }
          op read(): Owner;
          `,
          host,
          { IsTCGCNeeded: true },
        );
        expectDiagnosticEmpty(program.diagnostics);
        const sdkContext = await createCSharpSdkContext(
          createEmitterContext(program),
          defaultOptions["sdk-context-options"],
        );
        expectDiagnosticEmpty(sdkContext.diagnostics);
        const [root, diagnostics] = createModel(sdkContext);
        expectDiagnosticEmpty(diagnostics);
        const pet = root.models.find((model) => model.name === "Pet");
        const owner = root.models.find((model) => model.name === "Owner");
        ok(pet);
        ok(owner);
        deepStrictEqual(
          pet.decorators,
          scope === "python"
            ? []
            : [{ name: "Azure.ClientGenerator.Core.@dynamicModel", arguments: { scope } }],
        );
        deepStrictEqual(owner.decorators, []);
      },
    );
  });
});
