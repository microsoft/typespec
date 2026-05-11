import { deepStrictEqual, ok, strictEqual } from "assert";
import { describe, it } from "vitest";
import type { Program } from "../../src/core/program.js";
import { type DecoratorContext, type Model, type Type } from "../../src/core/types.js";
import { mockFile, t, TemplateWithMarkers } from "../../src/testing/index.js";
import { createRekeyableMap } from "../../src/utils/misc.js";
import { Tester } from "../tester.js";

describe("compiler: type cloning", () => {
  const blues = new Set<Type>();

  const BlueTester = Tester.files({
    "test.js": mockFile.js({
      $blue(_: Program, t: Type) {
        blues.add(t);
      },
    }),
  }).import("./test.js");

  testClone("models", t.code`@blue model ${t.model("test")} { p: string; }`);
  testClone("model properties", t.code`model Foo { @blue ${t.modelProperty("test")}: string }`);
  testClone("operations", t.code`@blue op ${t.op("test")}(): string;`);
  testClone("parameters", t.code`op test(@blue ${t.modelProperty("test")}: string): string;`);
  testClone("enums", t.code`@blue enum ${t.enum("test")} { e }`);
  testClone("enum members", t.code`enum Foo { @blue ${t.enumMember("test")}: 1 }`);
  testClone("interfaces", t.code`@blue interface ${t.interface("test")} { o(): void; }`);
  testClone("unions", t.code`@blue union ${t.union("test")} { s: string; n: int32; }`);

  function testClone(description: string, code: TemplateWithMarkers<{ test: Type }>) {
    it(`clones ${description}`, async () => {
      const { test, program } = await BlueTester.compile(code);
      const clone = program.checker.cloneType(test);
      ok(blues.has(clone!), "the clone is blue");
      deepStrictEqual(test, clone!);

      // Ensure that the cloned decorators list isn't reused directly
      if ("decorators" in test && "decorators" in clone) {
        clone.decorators.push({
          decorator: (_ctx: DecoratorContext, _type: Type) => {
            // Decorator not executed
          },
          args: [],
        });

        strictEqual(test.decorators.length, 1);
        strictEqual(clone.decorators.length, 2);
      }

      // Ensure that cloned members are re-parented
      switch (clone.kind) {
        case "Model":
          for (const each of clone.properties.values()) {
            strictEqual(each.model, clone, "model property not re-parented");
          }
          break;
        case "Enum":
          for (const each of clone.members.values()) {
            strictEqual(each.enum, clone, "enum member not re-parented");
          }
          break;
        case "Interface":
          for (const each of clone.operations.values()) {
            strictEqual(each.interface, clone, "interface operation not re-parented");
          }
          break;
        case "Union":
          for (const each of clone.variants.values()) {
            strictEqual(each.union, clone, "union variant not re-parented");
          }
          break;
      }

      // Ensure that you can set your own member list
      switch (test.kind) {
        case "Model":
          const newModel = program.checker.cloneType(test, {
            properties: createRekeyableMap(),
          });
          ok(test.properties.size > 0, "no properties to change");
          strictEqual(newModel.properties.size, 0, "properties not set.");
          break;
        case "Enum":
          const newEnum = program.checker.cloneType(test, {
            members: createRekeyableMap(),
          });
          ok(test.members.size > 0, "no members to change");
          strictEqual(newEnum.members.size, 0, "members not set");
          break;
        case "Interface":
          const newInterface = program.checker.cloneType(test, {
            operations: createRekeyableMap(),
          });
          ok(test.operations.size > 0, "no operations to change");
          strictEqual(newInterface.operations.size, 0, "operations not set");
          break;
        case "Union":
          const newUnion = program.checker.cloneType(test, {
            variants: createRekeyableMap(),
          });
          ok(test.variants.size > 0, "no variants to change");
          strictEqual(newUnion.variants.size, 0, "variants not set");
          break;
      }
    });
  }

  it("preserves template arguments", async () => {
    const { test, program } = await Tester.compile(t.code`
      model Template<T, U> {}
      model Test {
        ${t.modelProperty("test")}: Template<string, int32>;
      }
    `);
    strictEqual(test.kind, "ModelProperty" as const);
    strictEqual(test.type.kind, "Model" as const);
    const testModel = test.type as Model;
    const clone = program.checker.cloneType(testModel);
    deepStrictEqual(testModel.templateMapper, clone.templateMapper);
  });
});
