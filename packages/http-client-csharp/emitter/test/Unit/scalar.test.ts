import { TestHost } from "@typespec/compiler/testing";
import { strictEqual } from "assert";
import { beforeEach, describe, it } from "vitest";
import { createModel } from "../../src/lib/client-model-builder.js";
import {
  createEmitterContext,
  createEmitterTestHost,
  createNetSdkContext,
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
      { IsNamespaceNeeded: true, IsAzureCoreNeeded: true }
    );
    runner.compileAndDiagnose;
    const context = createEmitterContext(program);
    const sdkContext = await createNetSdkContext(context);
    const root = createModel(sdkContext);
    const type = root.Clients[0].Operations[0].Parameters[1].Type;
    strictEqual(type.kind, "string");
    strictEqual(type.name, "azureLocation");
    strictEqual(type.crossLanguageDefinitionId, "Azure.Core.azureLocation");
    strictEqual(type.baseType?.kind, "string");
    strictEqual(type.baseType.name, "string");
    strictEqual(type.baseType.crossLanguageDefinitionId, "TypeSpec.string");
  });
});
