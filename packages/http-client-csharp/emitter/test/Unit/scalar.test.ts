vi.resetModules();

import { TestHost } from "@typespec/compiler/testing";
import { strictEqual } from "assert";
import { beforeEach, describe, it, vi } from "vitest";
import { createModel } from "../../src/lib/client-model-builder.js";
import {
  createCSharpSdkContext,
  createEmitterContext,
  createEmitterTestHost,
  typeSpecCompile,
} from "./utils/test-util.js";

describe("Test GetInputType for scalar", () => {
  let runner: TestHost;

  beforeEach(async () => {
    runner = await createEmitterTestHost();
  });

  it("azureLocation scalar", async () => {
    const program = await typeSpecCompile(
      `
        op test(@query location: azureLocation): void;
      `,
      runner,
      { IsNamespaceNeeded: true, IsAzureCoreNeeded: true },
    );
    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context);
    const root = createModel(sdkContext);
    const inputParamArray = root.clients[0].operations[0].parameters.filter(
      (p) => p.name === "location",
    );
    strictEqual(1, inputParamArray.length);
    const type = inputParamArray[0].type;
    strictEqual(type.kind, "string");
    strictEqual(type.name, "azureLocation");
    strictEqual(type.crossLanguageDefinitionId, "Azure.Core.azureLocation");
    strictEqual(type.baseType?.kind, "string");
    strictEqual(type.baseType.name, "string");
    strictEqual(type.baseType.crossLanguageDefinitionId, "TypeSpec.string");
  });
});
