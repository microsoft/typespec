import { ok, strictEqual } from "assert";
import { beforeEach, describe, it } from "vitest";
import { setTypeSpecNamespace } from "../../src/core/index.js";
import {
  BasicTestRunner,
  TestHost,
  createTestHost,
  createTestWrapper,
  expectDiagnostics,
} from "../../src/testing/index.js";

describe("compiler: checker: decorators", () => {
  let testHost: TestHost;

  beforeEach(async () => {
    testHost = await createTestHost();
  });

  describe("declaration", () => {
    let runner: BasicTestRunner;
    let $testDec: any;
    let testJs: Record<string, any>;
    beforeEach(() => {
      $testDec = () => {};
      testJs = {
        $testDec,
      };
      testHost.addJsFile("test.js", testJs);
      runner = createTestWrapper(testHost, {
        autoImports: ["./test.js"],
        autoUsings: ["TypeSpec.Reflection"],
      });
    });

    it("bind implementation to declaration", async () => {
      await runner.compile(`
        extern dec testDec(target: unknown);
      `);

      const testDecDecorator = runner.program
        .getGlobalNamespaceType()
        .decoratorDeclarations.get("testDec");
      ok(testDecDecorator);

      strictEqual(testDecDecorator.implementation, $testDec);
    });

    it("bind implementation to declaration when in a namespace", async () => {
      const $otherDec = () => {};
      testJs.$otherDec = $otherDec;
      setTypeSpecNamespace("MyLib", $otherDec);

      await runner.compile(`
        extern dec testDec(target: unknown);
        namespace MyLib {
          extern dec otherDec(target: unknown);
        }
      `);

      const testDecDecorator = runner.program
        .getGlobalNamespaceType()
        .decoratorDeclarations.get("testDec");
      ok(testDecDecorator);

      const myLib = runner.program.getGlobalNamespaceType().namespaces.get("MyLib");
      ok(myLib);
      const otherDecDecorator = myLib.decoratorDeclarations.get("otherDec");
      ok(otherDecDecorator);

      strictEqual(otherDecDecorator.implementation, $otherDec);
    });

    it("errors if decorator is missing extern modifier", async () => {
      const diagnostics = await runner.diagnose(`
        dec testDec(target: unknown);
      `);
      expectDiagnostics(diagnostics, {
        code: "decorator-extern",
        message: "A decorator declaration must be prefixed with the 'extern' modifier.",
      });
    });

    it("errors if rest parameter type is not an array expression", async () => {
      const diagnostics = await runner.diagnose(`
        extern dec testDec(target: unknown, ...rest: string);
      `);
      expectDiagnostics(diagnostics, {
        code: "rest-parameter-array",
        message: "A rest parameter must be of an array type.",
      });
    });

    it("errors if extern decorator is missing implementation", async () => {
      const diagnostics = await runner.diagnose(`
        extern dec notImplemented(target: unknown);
      `);
      expectDiagnostics(diagnostics, {
        code: "missing-implementation",
        message: "Extern declaration must have an implementation in JS file.",
      });
    });
  });

  describe("usage", () => {
    let runner: BasicTestRunner;
    let calledArgs: any[] | undefined;
    beforeEach(() => {
      calledArgs = undefined;
      testHost.addJsFile("test.js", {
        $testDec: (...args: any[]) => (calledArgs = args),
      });
      runner = createTestWrapper(testHost, {
        autoImports: ["./test.js"],
        autoUsings: ["TypeSpec.Reflection"],
      });
    });

    function expectDecoratorCalledWith(target: unknown, ...args: unknown[]) {
      ok(calledArgs, "Decorator was not called.");
      strictEqual(calledArgs.length, 2 + args.length);
      strictEqual(calledArgs[0].program, runner.program);
      strictEqual(calledArgs[1], target);
      for (const [index, arg] of args.entries()) {
        strictEqual(calledArgs[2 + index], arg);
      }
    }

    function expectDecoratorNotCalled() {
      strictEqual(calledArgs, undefined);
    }

    it("calls a decorator with no argument", async () => {
      const { Foo } = await runner.compile(`
        extern dec testDec(target: unknown);

        @testDec
        @test
        model Foo {}
      `);

      expectDecoratorCalledWith(Foo);
    });

    it("calls a decorator with arguments", async () => {
      const { Foo } = await runner.compile(`
        extern dec testDec(target: unknown, arg1: valueof string, arg2: valueof string);

        @testDec("one", "two")
        @test
        model Foo {}
      `);

      expectDecoratorCalledWith(Foo, "one", "two");
    });

    it("calls a decorator with optional arguments", async () => {
      const { Foo } = await runner.compile(`
        extern dec testDec(target: unknown, arg1: valueof string, arg2?: valueof string);

        @testDec("one")
        @test
        model Foo {}
      `);

      expectDecoratorCalledWith(Foo, "one");
    });

    it("calls a decorator with rest arguments", async () => {
      const { Foo } = await runner.compile(`
        extern dec testDec(target: unknown, arg1: valueof string, ...args: valueof string[]);

        @testDec("one", "two", "three", "four")
        @test
        model Foo {}
      `);

      expectDecoratorCalledWith(Foo, "one", "two", "three", "four");
    });

    it("errors if not calling with enough arguments", async () => {
      const diagnostics = await runner.diagnose(`
        extern dec testDec(target: unknown, arg1: string, arg2: string);

        @testDec("one")
        model Foo {}
      `);

      expectDiagnostics(diagnostics, {
        code: "invalid-argument-count",
        message: "Expected 2 arguments, but got 1.",
      });
      expectDecoratorNotCalled();
    });

    it("errors if not calling with too many arguments", async () => {
      const [{ Foo }, diagnostics] = await runner.compileAndDiagnose(`
        extern dec testDec(target: unknown, arg1: valueof string, arg2?: valueof string);

        @testDec("one", "two", "three")
        @test model Foo {}
      `);

      expectDiagnostics(diagnostics, {
        code: "invalid-argument-count",
        message: "Expected 1-2 arguments, but got 3.",
      });
      expectDecoratorCalledWith(Foo, "one", "two");
    });

    it("errors if not calling with argument and decorator expect none", async () => {
      const diagnostics = await runner.diagnose(`
        extern dec testDec(target: unknown);

        @testDec("one")
        model Foo {}
      `);

      expectDiagnostics(diagnostics, {
        code: "invalid-argument-count",
        message: "Expected 0 arguments, but got 1.",
      });
    });

    it("errors if not calling with too few arguments with rest", async () => {
      const diagnostics = await runner.diagnose(`
        extern dec testDec(target: unknown, arg1: string, ...args: string[]);

        @testDec
        model Foo {}
      `);

      expectDiagnostics(diagnostics, {
        code: "invalid-argument-count",
        message: "Expected at least 1 arguments, but got 0.",
      });
      expectDecoratorNotCalled();
    });

    it("errors if target type is incorrect", async () => {
      const diagnostics = await runner.diagnose(`
        extern dec testDec(target: Union, arg1: string);

        @testDec("abc")
        model Foo {}
      `);

      expectDiagnostics(diagnostics, {
        code: "decorator-wrong-target",
        message: "Cannot apply @testDec decorator to Foo since it is not assignable to Union",
      });
      expectDecoratorNotCalled();
    });

    it("errors if argument is not assignable to parameter type", async () => {
      const diagnostics = await runner.diagnose(`
        extern dec testDec(target: unknown, arg1: string);

        @testDec(123)
        model Foo {}
      `);

      expectDiagnostics(diagnostics, {
        code: "invalid-argument",
        message: "Argument '123' is not assignable to parameter of type 'string'",
      });
      expectDecoratorNotCalled();
    });

    it("errors if argument is not assignable to rest parameter type", async () => {
      const diagnostics = await runner.diagnose(`
        extern dec testDec(target: unknown, ...args: string[]);

        @testDec(123, 456)
        model Foo {}
      `);

      expectDiagnostics(diagnostics, [
        {
          code: "invalid-argument",
          message: "Argument '123' is not assignable to parameter of type 'string'",
        },
        {
          code: "invalid-argument",
          message: "Argument '456' is not assignable to parameter of type 'string'",
        },
      ]);
      expectDecoratorNotCalled();
    });

    // Regresssion test for https://github.com/microsoft/typespec/issues/3211
    it("augmenting a template model property before a decorator declaration resolve the declaration correctly", async () => {
      await runner.compile(`
        model Foo<T> {
          prop: T;
        }
        model Test {foo: Foo<string>}

        @@testDec(Foo.prop, "abc");
        extern dec testDec(target: unknown, arg1: valueof string);

      `);
      strictEqual(calledArgs![2], "abc");
    });

    describe("value marshalling", () => {
      async function testCallDecorator(type: string, value: string): Promise<any> {
        await runner.compile(`
          extern dec testDec(target: unknown, arg1: ${type});

          @testDec(${value})
          @test
          model Foo {}
        `);
        return calledArgs![2];
      }

      describe("passing a string literal", () => {
        it("`: valueof string` cast the value to a JS string", async () => {
          const arg = await testCallDecorator("valueof string", `"one"`);
          strictEqual(arg, "one");
        });

        it("`: string` keeps the StringLiteral type", async () => {
          const arg = await testCallDecorator("string", `"one"`);
          strictEqual(arg.kind, "String");
        });
      });

      describe("passing a string template", () => {
        it("`: valueof string` cast the value to a JS string", async () => {
          const arg = await testCallDecorator(
            "valueof string",
            '"Start ${"one"} middle ${"two"} end"'
          );
          strictEqual(arg, "Start one middle two end");
        });

        it("`: string` keeps the StringTemplate type", async () => {
          const arg = await testCallDecorator("string", '"Start ${"one"} middle ${"two"} end"');
          strictEqual(arg.kind, "StringTemplate");
        });
      });

      describe("passing a numeric literal", () => {
        it("valueof int32 cast the value to a JS number", async () => {
          const arg = await testCallDecorator("valueof int32", `123`);
          strictEqual(arg, 123);
        });
      });

      describe("passing a boolean literal", () => {
        it("valueof boolean cast the value to a JS boolean", async () => {
          const arg = await testCallDecorator("valueof boolean", `true`);
          strictEqual(arg, true);
        });
      });
    });
  });

  it("can have the same name as types", async () => {
    let called = false;
    testHost.addJsFile("test.js", {
      $foo() {
        called = true;
      },
    });

    testHost.addTypeSpecFile(
      "test.tsp",
      `
      import "./test.js";
      model foo { };
      @foo()
      model MyFoo { };
      `
    );

    await testHost.compile("test.tsp");
    ok(called);
  });

  it("doesn't conflict with type bindings at global scope", async () => {
    testHost.addJsFile("test.js", {
      $foo(_: any, __: any, t: any) {},
    });

    testHost.addTypeSpecFile(
      "test.tsp",
      `
      import "./test.js";

      model foo { }
      @foo(foo)
      model Bar { }
      `
    );

    await testHost.diagnose("test.tsp");
  });

  it("evaluates in outside-in order", async () => {
    let result = false;
    let blueThing: any;

    testHost.addJsFile("test.js", {
      $blue(_: any, t: any) {
        blueThing = t;
      },
      $isBlue(_: any, t: any) {
        result = blueThing === t;
      },
    });

    testHost.addTypeSpecFile(
      "test.tsp",
      `
      import "./test.js";

      @isBlue
      @blue
      model Foo { };
      `
    );

    await testHost.diagnose("test.tsp");
    ok(result, "expected Foo to be blue in isBlue decorator");
  });
});
