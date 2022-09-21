import { deepStrictEqual, ok, strictEqual } from "assert";
import { Program } from "../../core/program.js";
import { DecoratorContext, Type } from "../../core/types.js";
import { createTestHost, TestHost } from "../../testing/index.js";

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

  testClone("models", "@test @blue model test { }");
  testClone("model properties", "model Foo { @test @blue test: string }");
  testClone("operations", "@test @blue op test(): string;");
  testClone("parameters", "op test(@test @blue test: string): string;");
  testClone("enums", "@test @blue enum test { }");
  testClone("enum members", "enum Foo { @test @blue test: 1 }");

  function testClone(description: string, code: string) {
    it(`clones ${description}`, async () => {
      testHost.addCadlFile(
        "test.cadl",
        `
        import "./test.js";
        ${code}
        `
      );

      const { test } = (await testHost.compile("./test.cadl")) as {
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
    });
  }

  it("preserves template arguments", async () => {
    testHost.addCadlFile(
      "test.cadl",
      `
      model Template<T, U> {}
      model Test {
        @test test: Template<string, int32>;
      }
      `
    );

    const { test } = await testHost.compile("./test.cadl");
    strictEqual(test.kind, "ModelProperty" as const);
    strictEqual(test.type.kind, "Model" as const);
    const clone = testHost.program.checker.cloneType(test.type);
    strictEqual(clone.templateArguments?.length, 2);
    deepStrictEqual(test.type.templateArguments, clone.templateArguments);
  });
});
