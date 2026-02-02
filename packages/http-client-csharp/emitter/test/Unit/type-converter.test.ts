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
    const root = createModel(sdkContext);

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

describe("Union types to model hierarchies", () => {
  let runner: TestHost;

  beforeEach(async () => {
    runner = await createEmitterTestHost();
  });
  const cases = [
    { 
      name: "request bodies",
      opDefinition: `op test(@body input: MyUnion): void;`,
    },
    { 
      name: "response bodies",
      opDefinition: `op test(): MyUnion;`,
    },
    {
      name: "properties",
      opDefinition: `
      model ContainerModel {
        unionProp: MyUnion;
      }
      op test(): ContainerModel;
      `,
    }
  ]
  cases.forEach(({name, opDefinition }) => it(`should convert ${name} union with members to model hierarchy`, async () => {
      const program = await typeSpecCompile(
        `
        model Alpha {
          alphaProp: string;
          type: "alpha";
        }
        model Beta {
          betaProp: int32;
          type: "beta";
        }
        @discriminated(#{ discriminatorPropertyName: "type", envelope: "none" })
        union MyUnion {
          "alpha": Alpha,
          "beta": Beta
        }
        ${opDefinition}
        `,
        runner,
        { IsTCGCNeeded: true },
      );
      const context = createEmitterContext(program);
      const sdkContext = await createCSharpSdkContext(context);
      const root = createModel(sdkContext);

      const alphaModel = root.models.find((m) => m.name === "Alpha");
      ok(alphaModel, "Alpha should exist");

      const betaModel = root.models.find((m) => m.name === "Beta");
      ok(betaModel, "Beta should exist");

      const myUnion = root.models.find((m) => m.name === "MyUnion");
      ok(myUnion, "MyUnion should exist");

      // Validate that MyUnion is a model
      strictEqual(myUnion.kind, "model", "MyUnion should be converted to a model");

      // Validate that Alpha and Beta inherit from MyUnion
      strictEqual(alphaModel.baseModel, myUnion, "Alpha should inherit from MyUnion");
      strictEqual(betaModel.baseModel, myUnion, "Beta should inherit from MyUnion");

      // Validate the base model has the discriminator property
      const discriminatorProp = myUnion.properties.find((p) => p.name === "type");
      ok(discriminatorProp, "MyUnion should have a discriminator property 'type'");
      strictEqual(
        discriminatorProp.type.kind,
        "enum",
        "Discriminator property 'type' should be of type string",
      );

      // Validate that the discriminator property has the correct enum values
      const enumValues = new Set(discriminatorProp.type.values.map((v) => v.name));
      strictEqual(enumValues.has("alpha"), true, "Discriminator enum should include 'alpha'");
      strictEqual(enumValues.has("beta"), true, "Discriminator enum should include 'beta'");

      // Validate that Alpha and Beta DO NOT have the discriminator property
      const alphaDiscriminatorProp = alphaModel.properties.find((p) => p.name === "type");
      strictEqual(
        alphaDiscriminatorProp,
        undefined,
        "Alpha should not have the discriminator property 'type'",
      );

      const betaDiscriminatorProp = betaModel.properties.find((p) => p.name === "type");
      strictEqual(
        betaDiscriminatorProp,
        undefined,
        "Beta should not have the discriminator property 'type'",
      );
    })
  );
});
