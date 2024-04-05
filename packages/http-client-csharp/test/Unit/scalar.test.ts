import { TestHost } from "@typespec/compiler/testing";
import { deepStrictEqual } from "assert";
import { beforeEach, describe, it } from "vitest";
import { createModel } from "../../src/lib/client-model-builder.js";
import { InputPrimitiveTypeKind } from "../../src/type/input-primitive-type-kind.js";
import { InputTypeKind } from "../../src/type/input-type-kind.js";
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
    const sdkContext = createNetSdkContext(context);
    const root = createModel(sdkContext);
    deepStrictEqual(root.Clients[0].Operations[0].Parameters[0].Type.Kind, InputTypeKind.Primitive);
    deepStrictEqual(
      root.Clients[0].Operations[0].Parameters[0].Type.Name,
      InputPrimitiveTypeKind.AzureLocation
    );
    deepStrictEqual(
      {
        Kind: InputTypeKind.Primitive,
        Name: InputPrimitiveTypeKind.AzureLocation,
        IsNullable: false,
      },
      root.Clients[0].Operations[0].Parameters[0].Type
    );
  });
});
