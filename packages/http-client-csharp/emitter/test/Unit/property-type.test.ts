import { UsageFlags } from "@azure-tools/typespec-client-generator-core";
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

describe("Test GetInputType for array", () => {
  let runner: TestHost;

  beforeEach(async () => {
    runner = await createEmitterTestHost();
  });

  it("array as request", async () => {
    const program = await typeSpecCompile(
      `
        op test(@body input: string[]): string[];
      `,
      runner
    );
    runner.compileAndDiagnose;
    const context = createEmitterContext(program);
    const sdkContext = await createNetSdkContext(context);
    const root = createModel(sdkContext);
    const type = root.Clients[0].Operations[0].Parameters[3].Type;
    strictEqual(type.Kind, "array");
    strictEqual(type.CrossLanguageDefinitionId, "TypeSpec.Array");
    strictEqual(type.ValueType.Kind, "string");
    strictEqual(type.ValueType.CrossLanguageDefinitionId, "TypeSpec.string");
  });

  it("array as response", async () => {
    const program = await typeSpecCompile(
      `
        op test(): string[];
      `,
      runner
    );
    const context = createEmitterContext(program);
    const sdkContext = await createNetSdkContext(context);
    const root = createModel(sdkContext);
    const bodyType = root.Clients[0].Operations[0].Responses[0].BodyType;
    strictEqual(bodyType?.Kind, "array");
    strictEqual(bodyType.CrossLanguageDefinitionId, "TypeSpec.Array");
    strictEqual(bodyType.ValueType.Kind, "string");
    strictEqual(bodyType.ValueType.CrossLanguageDefinitionId, "TypeSpec.string");
  });
});

describe("Test GetInputType for enum", () => {
  let runner: TestHost;

  beforeEach(async () => {
    runner = await createEmitterTestHost();
  });

  it("Fixed string enum", async () => {
    const program = await typeSpecCompile(
      `
        #suppress "@azure-tools/typespec-azure-core/use-extensible-enum" "Enums should be defined without the @fixed decorator."
        @doc("fixed string enum")
        @fixed
        enum SimpleEnum {
            @doc("Enum value one")
            One: "1",
            @doc("Enum value two")
            Two: "2",
            @doc("Enum value four")
            Four: "4"
        }
        #suppress "@azure-tools/typespec-azure-core/use-standard-operations" "Operation 'test' should be defined using a signature from the Azure.Core namespace."
        @doc("test fixed enum.")
        op test(@doc("fixed enum as input.")@body input: SimpleEnum): string[];
      `,
      runner,
      { IsNamespaceNeeded: true, IsAzureCoreNeeded: true }
    );
    const context = createEmitterContext(program);
    const sdkContext = await createNetSdkContext(context);
    const root = createModel(sdkContext);
    const type = root.Clients[0].Operations[0].Parameters[3].Type;
    strictEqual(type.Kind, "enum");
    strictEqual(type.Name, "SimpleEnum");
    strictEqual(type.IsExtensible, false);
    strictEqual(type.Description, "fixed string enum");
    strictEqual(type.CrossLanguageDefinitionId, "Azure.Csharp.Testing.SimpleEnum");
    strictEqual(type.Accessibility, undefined);
    strictEqual(type.ValueType.Kind, "string");
    strictEqual(type.Values.length, 3);
    strictEqual(type.Values[0].Name, "One");
    strictEqual(type.Values[0].Value, "1");
    strictEqual(type.Values[1].Name, "Two");
    strictEqual(type.Values[1].Value, "2");
    strictEqual(type.Values[2].Name, "Four");
    strictEqual(type.Values[2].Value, "4");
    strictEqual(type.Usage, UsageFlags.Input | UsageFlags.Json);
  });

  it("Fixed int enum", async () => {
    const program = await typeSpecCompile(
      `
      #suppress "@azure-tools/typespec-azure-core/use-extensible-enum" "Enums should be defined without the @fixed decorator."
      @doc("Fixed int enum")
      @fixed
      enum FixedIntEnum {
          @doc("Enum value one")
          One: 1,
          @doc("Enum value two")
          Two: 2,
          @doc("Enum value four")
          Four: 4
      }
      #suppress "@azure-tools/typespec-azure-core/use-standard-operations" "Operation 'test' should be defined using a signature from the Azure.Core namespace."
      @doc("test fixed enum.")
      op test(@doc("fixed enum as input.")@body input: FixedIntEnum): string[];
    `,
      runner,
      { IsNamespaceNeeded: true, IsAzureCoreNeeded: true }
    );
    const context = createEmitterContext(program);
    const sdkContext = await createNetSdkContext(context);
    const root = createModel(sdkContext);
    const type = root.Clients[0].Operations[0].Parameters[3].Type;
    strictEqual(type.Kind, "enum");
    strictEqual(type.Name, "FixedIntEnum");
    strictEqual(type.CrossLanguageDefinitionId, "Azure.Csharp.Testing.FixedIntEnum");
    strictEqual(type.Accessibility, undefined);
    strictEqual(type.Description, "Fixed int enum");
    strictEqual(type.ValueType.CrossLanguageDefinitionId, "TypeSpec.int32");
    strictEqual(type.ValueType.Kind, "int32");
    strictEqual(type.Values.length, 3);
    strictEqual(type.Values[0].Name, "One");
    strictEqual(type.Values[0].Value, 1);
    strictEqual(type.Values[1].Name, "Two");
    strictEqual(type.Values[1].Value, 2);
    strictEqual(type.Values[2].Name, "Four");
    strictEqual(type.Values[2].Value, 4);
    strictEqual(type.IsExtensible, false);
    strictEqual(type.Usage, UsageFlags.Input | UsageFlags.Json);
  });

  it("fixed enum", async () => {
    const program = await typeSpecCompile(
      `
        @doc("Fixed enum")
        enum FixedEnum {
            One: "1",
            Two: "2",
            Four: "4"
        }
        op test(@body input: FixedEnum): string[];
      `,
      runner
    );
    const context = createEmitterContext(program);
    const sdkContext = await createNetSdkContext(context);
    const root = createModel(sdkContext);
    const type = root.Clients[0].Operations[0].Parameters[3].Type;
    strictEqual(type.Kind, "enum");
    strictEqual(type.Name, "FixedEnum");
    strictEqual(type.CrossLanguageDefinitionId, "Azure.Csharp.Testing.FixedEnum");
    strictEqual(type.Accessibility, undefined);
    strictEqual(type.Description, "Fixed enum");
    strictEqual(type.ValueType.Kind, "string");
    strictEqual(type.ValueType.CrossLanguageDefinitionId, "TypeSpec.string");
    strictEqual(type.Values.length, 3);
    strictEqual(type.Values[0].Name, "One");
    strictEqual(type.Values[0].Value, "1");
    strictEqual(type.Values[1].Name, "Two");
    strictEqual(type.Values[1].Value, "2");
    strictEqual(type.Values[2].Name, "Four");
    strictEqual(type.Values[2].Value, "4");
    strictEqual(type.Usage, UsageFlags.Input | UsageFlags.Json);
    strictEqual(type.IsExtensible, false);
  });
});
