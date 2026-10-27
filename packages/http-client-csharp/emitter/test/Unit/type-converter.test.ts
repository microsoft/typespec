vi.resetModules();

import type { DecoratorInfo } from "@azure-tools/typespec-client-generator-core";
import {
  expectDiagnosticEmpty,
  expectDiagnostics,
  type TestHost,
} from "@typespec/compiler/testing";
import { HttpClientTestLibrary } from "@typespec/http-client/testing";
import { deepStrictEqual, ok, strictEqual } from "assert";
import { beforeEach, describe, it, vi } from "vitest";
import { createModel } from "../../src/lib/client-model-builder.js";
import { getAllModelDecorators } from "../../src/lib/type-converter.js";
import type { InputNamespace } from "../../src/type/input-type.js";
import {
  createCSharpSdkContext,
  createEmitterContext,
  createEmitterTestHost,
  typeSpecCompile,
} from "./utils/test-util.js";

describe("getAllModelDecorators", () => {
  it("parses all namespace decorators", async function () {
    const decoratorOne: DecoratorInfo = {
      name: "d1",
      arguments: {},
    };
    const decoratorTwo: DecoratorInfo = {
      name: "d2",
      arguments: {},
    };
    const modelDecorator: DecoratorInfo = {
      name: "modelDecorator",
      arguments: {},
    };
    const ns: InputNamespace = {
      name: "testNamespace",
      fullName: "parentNamespace.testNamespace",
      namespaces: [],
      decorators: [decoratorOne, decoratorTwo],
    };

    const allDecorators = getAllModelDecorators(ns, [modelDecorator]);
    strictEqual(allDecorators.length, 3);
    strictEqual(allDecorators[0].name, decoratorOne.name);
    strictEqual(allDecorators[1].name, decoratorTwo.name);
    strictEqual(allDecorators[2].name, modelDecorator.name);
  });
});

describe("Enum value references", () => {
  let runner: TestHost;

  beforeEach(async () => {
    runner = await createEmitterTestHost();
  });

  it("enum values should reference the parent enum type", async () => {
    const program = await typeSpecCompile(
      `
      enum TestEnum {
        ValueOne: "value1",
        ValueTwo: "value2",
        ValueThree: "value3",
      }

      model TestModel {
        prop: TestEnum;
      }

      op test(@body input: TestModel): void;
    `,
      runner,
    );
    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context);
    const [root] = createModel(sdkContext);
    const enumType = root.enums.find((e) => e.name === "TestEnum");
    ok(enumType, "TestEnum should exist in the enums list");
    strictEqual(enumType.values.length, 3, "TestEnum should have 3 values");

    // Validate that each enum value references the same parent enum instance
    for (const enumValue of enumType.values) {
      ok(enumValue.enumType);

      strictEqual(enumValue.enumType, enumType);

      // Additional validation: ensure the referenced enum has the correct properties
      strictEqual(enumValue.enumType.kind, "enum");
      strictEqual(enumValue.enumType.name, "TestEnum");
      strictEqual(enumValue.enumType.crossLanguageDefinitionId, enumType.crossLanguageDefinitionId);
    }
  });
});

describe("External types", () => {
  let runner: TestHost;

  beforeEach(async () => {
    runner = await createEmitterTestHost();
    await runner.addTypeSpecLibrary(HttpClientTestLibrary);
  });

  describe.each([
    { kind: "model", declaration: "model ExternalValue { value: string; }" },
    { kind: "enum", declaration: 'enum ExternalValue { One: "one", Two: "two" }' },
    { kind: "union", declaration: "union ExternalValue { text: string, count: int32 }" },
    { kind: "scalar", declaration: "scalar ExternalValue extends string;" },
    { kind: "nullable", declaration: "union ExternalValue { string, null }" },
    { kind: "array", declaration: "model ExternalValue is Array<string>;" },
    { kind: "dict", declaration: "model ExternalValue is Record<string>;" },
    { kind: "utcDateTime", declaration: "scalar ExternalValue extends utcDateTime;" },
    { kind: "duration", declaration: "scalar ExternalValue extends duration;" },
  ])("experimental external $kind", ({ declaration, kind }) => {
    it.each([
      { scope: "@typespec/http-client-csharp", applies: true },
      { scope: "!other-emitter", applies: true },
      { scope: "other-emitter", applies: false },
    ])("preserves metadata scoped to $scope", async ({ scope, applies }) => {
      const program = await typeSpecCompile(
        `
        @TypeSpec.HttpClient.experimental(#{
          emitterScope: "${scope}", diagnosticId: "EXTERNAL001", dependsOn: #["DEP001"]
        })
        @alternateType({ identity: "External.Value" }, "csharp")
        ${declaration}
        model Wrapper { value: ExternalValue; }
        op read(): Wrapper;
        `,
        runner,
        { IsTCGCNeeded: true, IsHttpClientNeeded: true },
      );
      const sdkContext = await createCSharpSdkContext(createEmitterContext(program));
      expectDiagnostics(
        sdkContext.diagnostics,
        kind === "union"
          ? [{ code: "@azure-tools/typespec-azure-core/union-enums-multiple-kind" }]
          : [],
      );
      const [root, diagnostics] = createModel(sdkContext);
      expectDiagnosticEmpty(diagnostics);
      const type = root.models.find((model) => model.name === "Wrapper")!.properties[0].type;
      strictEqual(type.external?.identity, "External.Value");
      deepStrictEqual(
        type.experimental,
        applies ? { diagnosticId: "EXTERNAL001", dependsOn: ["DEP001"] } : undefined,
      );
    });
  });

  it("should convert external type from @alternateType decorator", async () => {
    const program = await typeSpecCompile(
      `
      @alternateType({
        identity: "Azure.Core.Expressions.DataFactoryExpression",
        package: "Azure.Core.Expressions",
        minVersion: "1.0.0",
      }, "csharp")
      union Dfe<T> {
        T,
        DfeExpression: string
      }
      
      model TestModel {
        prop: Dfe<string>;
      }
      
      op test(@body input: TestModel): void;
    `,
      runner,
      { IsTCGCNeeded: true },
    );
    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context);
    const [root] = createModel(sdkContext);

    const testModel = root.models.find((m) => m.name === "TestModel");
    ok(testModel, "TestModel should exist");

    const prop = testModel.properties.find((p) => p.name === "prop");
    ok(prop, "prop should exist");

    // The type should remain a union but with external info
    strictEqual(prop.type.kind, "union");
    ok((prop.type as any).external, "Type should have external info");
    strictEqual(
      (prop.type as any).external.identity,
      "Azure.Core.Expressions.DataFactoryExpression",
    );
    strictEqual((prop.type as any).external.package, "Azure.Core.Expressions");
    strictEqual((prop.type as any).external.minVersion, "1.0.0");
    // Verify union variants are preserved
    ok((prop.type as any).variantTypes, "Union should have variant types");
    strictEqual((prop.type as any).variantTypes.length, 2, "Union should have 2 variant types");
  });

  it("should convert external type on model", async () => {
    const program = await typeSpecCompile(
      `
      @alternateType({
        identity: "System.Text.Json.JsonElement",
        package: "System.Text.Json",
        minVersion: "8.0.0",
      }, "csharp")
      model JsonData {
        data: string;
      }
      
      model TestModel {
        jsonElement: JsonData;
      }
      
      op test(@body input: TestModel): void;
    `,
      runner,
      { IsTCGCNeeded: true },
    );
    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context);
    const [root] = createModel(sdkContext);

    const testModel = root.models.find((m) => m.name === "TestModel");
    ok(testModel, "TestModel should exist");

    const jsonElementProp = testModel.properties.find((p) => p.name === "jsonElement");
    ok(jsonElementProp, "jsonElement property should exist");

    // The type should remain a model but with external info
    strictEqual(jsonElementProp.type.kind, "model");
    ok((jsonElementProp.type as any).external, "Type should have external info");
    strictEqual((jsonElementProp.type as any).external.identity, "System.Text.Json.JsonElement");
    strictEqual((jsonElementProp.type as any).external.package, "System.Text.Json");
    strictEqual((jsonElementProp.type as any).external.minVersion, "8.0.0");
  });
});
