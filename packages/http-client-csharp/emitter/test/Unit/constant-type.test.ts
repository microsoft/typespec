vi.resetModules();

import { UsageFlags } from "@azure-tools/typespec-client-generator-core";
import { TestHost } from "@typespec/compiler/testing";
import { ok, strictEqual } from "assert";
import { beforeEach, describe, it, vi } from "vitest";
import { createModel } from "../../src/lib/client-model-builder.js";
import { InputEnumType, InputNullableType } from "../../src/type/input-type.js";
import {
  createCSharpSdkContext,
  createEmitterContext,
  createEmitterTestHost,
  typeSpecCompile,
} from "./utils/test-util.js";

describe("Name for constant type", () => {
  let runner: TestHost;

  beforeEach(async () => {
    runner = await createEmitterTestHost();
  });

  it("constant in model should have names", async () => {
    const program = await typeSpecCompile(
      `
      model TestModel {
        prop: "kind";
      }

      op test(@body input: TestModel): void;
    `,
      runner,
    );
    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context);
    const root = createModel(sdkContext);
    const testModel = root.models.find((m) => m.name === "TestModel");
    ok(testModel);
    const propertyType = testModel.properties[0].type;
    strictEqual(propertyType.kind, "constant");
    strictEqual(propertyType.name, "TestModelProp");
    strictEqual(propertyType.namespace, testModel.namespace);
    strictEqual(propertyType.access, undefined);
    strictEqual(propertyType.usage, UsageFlags.Input | UsageFlags.Json);
  });

  it("constants with the same value in different models should have different names", async () => {
    const program = await typeSpecCompile(
      `
      model TestModel1 {
        prop: "kind";
      }
      
      model TestModel2 {
        prop: "kind";
      }
      
      model Body {
        p: TestModel1 | TestModel2;
      }
      op test(@body input: Body): void;
    `,
      runner,
    );
    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context);
    const root = createModel(sdkContext);
    const testModel1 = root.models.find((m) => m.name === "TestModel1");
    ok(testModel1);
    const testModel2 = root.models.find((m) => m.name === "TestModel2");
    ok(testModel2);
    const model1PropType = testModel1.properties[0].type;
    strictEqual(model1PropType.kind, "constant");
    strictEqual(model1PropType.name, "TestModel1Prop");
    strictEqual(model1PropType.namespace, testModel1.namespace);
    strictEqual(model1PropType.access, undefined);
    strictEqual(model1PropType.usage, UsageFlags.Input | UsageFlags.Json);
    const model2PropType = testModel2.properties[0].type;
    strictEqual(model2PropType.kind, "constant");
    strictEqual(model2PropType.name, "TestModel2Prop");
    strictEqual(model2PropType.namespace, testModel2.namespace);
    strictEqual(model2PropType.access, undefined);
    strictEqual(model2PropType.usage, UsageFlags.Input | UsageFlags.Json);
  });
});

describe("Constant enum conversion", () => {
  let runner: TestHost;

  beforeEach(async () => {
    runner = await createEmitterTestHost();
  });
  it("nullable constants should be converted to enums", async () => {
    const program = await typeSpecCompile(
      `
      model TestModel {
        prop: "someValue" | null;
      }

      op test(@body input: TestModel): void;
    `,
      runner,
    );
    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context);
    const root = createModel(sdkContext);
    const testModel = root.models.find((m) => m.name === "TestModel");
    ok(testModel);
    const propertyType = testModel.properties[0].type;
    strictEqual(propertyType.kind, "nullable");
    const valueType = (propertyType as InputNullableType).type;
    strictEqual(valueType.kind, "enum");
    const enumType = valueType as InputEnumType;
    strictEqual(enumType.name, "TestModelProp1");
    strictEqual(enumType.valueType.kind, "string");
    strictEqual(enumType.values.length, 1);
    strictEqual(enumType.values[0].name, "someValue");
    strictEqual(enumType.values[0].value, "someValue");
    strictEqual(enumType.namespace, testModel.namespace);
    strictEqual(enumType.access, undefined);
    strictEqual(enumType.usage, undefined);
  });

  it("optional constants should be converted to enums", async () => {
    const program = await typeSpecCompile(
      `
      model TestModel {
        prop?: "someValue";
      }

      op test(@body input: TestModel): void;
    `,
      runner,
    );
    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context);
    const root = createModel(sdkContext);
    const testModel = root.models.find((m) => m.name === "TestModel");
    ok(testModel);
    const propertyType = testModel.properties[0].type;
    strictEqual(propertyType.kind, "enum");
    const enumType = propertyType as InputEnumType;
    strictEqual(enumType.name, "TestModelProp");
    strictEqual(enumType.valueType.kind, "string");
    strictEqual(enumType.values.length, 1);
    strictEqual(enumType.values[0].name, "someValue");
    strictEqual(enumType.values[0].value, "someValue");
    strictEqual(enumType.namespace, testModel.namespace);
    strictEqual(enumType.access, undefined);
    strictEqual(enumType.usage, undefined);
  });
});
