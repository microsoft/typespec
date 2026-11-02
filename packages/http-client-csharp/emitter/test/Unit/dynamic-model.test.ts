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
    it("consumes TCGC metadata scoped to csharp", async () => {
      const host = await createEmitterTestHost();
      const program = await typeSpecCompile(
        `
          ${target === "namespace" ? '@dynamicModel("csharp")' : ""}
          namespace Pets {
            ${target === "model" ? '@dynamicModel("csharp")' : ""}
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
      deepStrictEqual(pet.decorators, [
        { name: "Azure.ClientGenerator.Core.@dynamicModel", arguments: { scope: "csharp" } },
      ]);
      deepStrictEqual(owner.decorators, []);
    });
  });
});
