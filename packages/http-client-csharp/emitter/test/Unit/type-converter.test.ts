vi.resetModules();

import { DecoratorInfo } from "@azure-tools/typespec-client-generator-core";
import { TestHost } from "@typespec/compiler/testing";
import { ok, strictEqual } from "assert";
import { beforeEach, describe, it, vi } from "vitest";
import { createModel } from "../../src/lib/client-model-builder.js";
import { getAllModelDecorators } from "../../src/lib/type-converter.js";
import { InputNamespace } from "../../src/type/input-type.js";
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
    const root = createModel(sdkContext);
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
    const root = createModel(sdkContext);

    const testModel = root.models.find((m) => m.name === "TestModel");
    ok(testModel, "TestModel should exist");

    const prop = testModel.properties.find((p) => p.name === "prop");
    ok(prop, "prop should exist");

    // The type should be an external type
    strictEqual(prop.type.kind, "external");
    strictEqual((prop.type as any).identity, "Azure.Core.Expressions.DataFactoryExpression");
    strictEqual((prop.type as any).package, "Azure.Core.Expressions");
    strictEqual((prop.type as any).minVersion, "1.0.0");
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
    const root = createModel(sdkContext);

    const testModel = root.models.find((m) => m.name === "TestModel");
    ok(testModel, "TestModel should exist");

    const jsonElementProp = testModel.properties.find((p) => p.name === "jsonElement");
    ok(jsonElementProp, "jsonElement property should exist");

    // The type should be an external type
    strictEqual(jsonElementProp.type.kind, "external");
    strictEqual((jsonElementProp.type as any).identity, "System.Text.Json.JsonElement");
    strictEqual((jsonElementProp.type as any).package, "System.Text.Json");
    strictEqual((jsonElementProp.type as any).minVersion, "8.0.0");
  });
});
