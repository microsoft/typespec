import { deepStrictEqual, ok, strictEqual } from "assert";
import { beforeEach, describe, it } from "vitest";
import type { Program } from "../../src/core/program.js";
import { DecoratorContext, Type } from "../../src/core/types.js";
import { TestHost, createTestHost } from "../../src/testing/index.js";
import { createRekeyableMap } from "../../src/utils/misc.js";

describe("compiler: type cloning", () => {
  let testHost: TestHost;
  const blues = new Set();

  beforeEach(async () => {
    testHost = await createTestHost();
    testHost.addJsFile("test.js", {
      $blue(_: Program, t: Type) {
        blues.add(t);
      },
    });
  });

  testClone("models", "@test @blue model test { p: string; }");
  testClone("model properties", "model Foo { @test @blue test: string }");
  testClone("operations", "@test @blue op test(): string;");
  testClone("parameters", "op test(@test @blue test: string): string;");
  testClone("enums", "@test @blue enum test { e }");
  testClone("enum members", "enum Foo { @test @blue test: 1 }");
  testClone("interfaces", "@test @blue interface test { o(): void; }");
  testClone("unions", "@test @blue union test { s: string; n: int32; }");

  function testClone(description: string, code: string) {
    it(`clones ${description}`, async () => {
      testHost.addTypeSpecFile(
        "test.tsp",
        `
        import "./test.js";
        ${code}
        `,
      );

      const { test } = (await testHost.compile("./test.tsp")) as {
        test: Type;
      };
      const clone = testHost.program.checker.cloneType(test);
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

        strictEqual(test.decorators.length, 2);
        strictEqual(clone.decorators.length, 3);
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
          const newModel = testHost.program.checker.cloneType(test, {
            properties: createRekeyableMap(),
          });
          ok(test.properties.size > 0, "no properties to change");
          strictEqual(newModel.properties.size, 0, "properties not set.");
          break;
        case "Enum":
          const newEnum = testHost.program.checker.cloneType(test, {
            members: createRekeyableMap(),
          });
          ok(test.members.size > 0, "no members to change");
          strictEqual(newEnum.members.size, 0, "members not set");
          break;
        case "Interface":
          const newInterface = testHost.program.checker.cloneType(test, {
            operations: createRekeyableMap(),
          });
          ok(test.operations.size > 0, "no operations to change");
          strictEqual(newInterface.operations.size, 0, "operations not set");
          break;
        case "Union":
          const newUnion = testHost.program.checker.cloneType(test, {
            variants: createRekeyableMap(),
          });
          ok(test.variants.size > 0, "no variants to change");
          strictEqual(newUnion.variants.size, 0, "variants not set");
          break;
      }
    });
  }

  it("preserves template arguments", async () => {
    testHost.addTypeSpecFile(
      "test.tsp",
      `
      model Template<T, U> {}
      model Test {
        @test test: Template<string, int32>;
      }
      `,
    );

    const { test } = await testHost.compile("./test.tsp");
    strictEqual(test.kind, "ModelProperty" as const);
    strictEqual(test.type.kind, "Model" as const);
    const clone = testHost.program.checker.cloneType(test.type);
    strictEqual(clone.templateArguments?.length, 2);
    deepStrictEqual(test.type.templateArguments, clone.templateArguments);
    deepStrictEqual(test.type.templateMapper, clone.templateMapper);
  });
});
