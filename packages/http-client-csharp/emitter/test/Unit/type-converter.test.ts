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
