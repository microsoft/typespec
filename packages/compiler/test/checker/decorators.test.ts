import { ok, strictEqual } from "assert";
import { setCadlNamespace, Type } from "../../core/index.js";
import {
  BasicTestRunner,
  createTestHost,
  createTestWrapper,
  expectDiagnostics,
  TestHost,
} from "../../testing/index.js";

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
      runner = createTestWrapper(testHost, (code) =>
        [`import "./test.js";`, "using Cadl.Reflection;", code].join("\n")
      );
    });

    it("bind implementation to declaration", async () => {
      await runner.compile(`
        extern dec testDec(target: Type);
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
      setCadlNamespace("MyLib", $otherDec);

      await runner.compile(`
        extern dec testDec(target: Type);
        namespace MyLib {
          extern dec otherDec(target: Type);
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
        dec testDec(target: Type);
      `);
      expectDiagnostics(diagnostics, {
        code: "decorator-extern",
        message: "A decorator declaration must be prefixed with the 'extern' modifier.",
      });
    });

    it("errors if rest parameter type is not an array expression", async () => {
      const diagnostics = await runner.diagnose(`
        extern dec testDec(target: Type, ...rest: StringLiteral);
      `);
      expectDiagnostics(diagnostics, {
        code: "rest-parameter-array",
        message: "A rest parameter must be of an array type.",
      });
    });

    it("errors if extern decorator is missing implementation", async () => {
      const diagnostics = await runner.diagnose(`
        extern dec notImplemented(target: Type);
      `);
      expectDiagnostics(diagnostics, {
        code: "missing-implementation",
        message: "Extern declaration must have an implementation in JS file.",
      });
    });
  });

  describe("usage", () => {
    let runner: BasicTestRunner;
    let calledArgs: any[];
    beforeEach(() => {
      testHost.addJsFile("test.js", {
        $testDec: (...args: any[]) => (calledArgs = args),
      });
      runner = createTestWrapper(testHost, (code) =>
        [`import "./test.js";`, "using Cadl.Reflection;", code].join("\n")
      );
    });

    function expectDecoratorCalledWith(target: Type, ...args: unknown[]) {
      strictEqual(calledArgs.length, 2 + args.length);
      strictEqual(calledArgs[0].program, runner.program);
      strictEqual(calledArgs[1], target);
      for (const [index, arg] of args.entries()) {
        strictEqual(calledArgs[2 + index], arg);
      }
    }

    it("calls a decorator with no argument", async () => {
      const { Foo } = await runner.compile(`
        extern dec testDec(target: Type);

        @testDec
        @test
        model Foo {}
      `);

      expectDecoratorCalledWith(Foo);
    });

    it("calls a decorator with arguments", async () => {
      const { Foo } = await runner.compile(`
        extern dec testDec(target: Type, arg1: StringLiteral, arg2: StringLiteral);

        @testDec("one", "two")
        @test
        model Foo {}
      `);

      expectDecoratorCalledWith(Foo, "one", "two");
    });

    it("calls a decorator with optional arguments", async () => {
      const { Foo } = await runner.compile(`
        extern dec testDec(target: Type, arg1: StringLiteral, arg2?: StringLiteral);

        @testDec("one")
        @test
        model Foo {}
      `);

      expectDecoratorCalledWith(Foo, "one");
    });

    it("calls a decorator with rest arguments", async () => {
      const { Foo } = await runner.compile(`
        extern dec testDec(target: Type, arg1: StringLiteral, ...args: StringLiteral[]);

        @testDec("one", "two", "three", "four")
        @test
        model Foo {}
      `);

      expectDecoratorCalledWith(Foo, "one", "two", "three", "four");
    });

    it("errors if not calling with enough arguments", async () => {
      const diagnostics = await runner.diagnose(`
        extern dec testDec(target: Type, arg1: StringLiteral, arg2: StringLiteral);

        @testDec("one")
        model Foo {}
      `);

      expectDiagnostics(diagnostics, {
        code: "invalid-argument-count",
        message: "Expected 2 arguments, but got 1.",
      });
    });

    it("errors if not calling with too many arguments", async () => {
      const diagnostics = await runner.diagnose(`
        extern dec testDec(target: Type, arg1: StringLiteral, arg2?: StringLiteral);

        @testDec("one", "two", "three")
        model Foo {}
      `);

      expectDiagnostics(diagnostics, {
        code: "invalid-argument-count",
        message: "Expected 1-2 arguments, but got 3.",
      });
    });

    it("errors if not calling with argument and decorator expect none", async () => {
      const diagnostics = await runner.diagnose(`
        extern dec testDec(target: Type);

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
        extern dec testDec(target: Type, arg1: StringLiteral, ...args: StringLiteral[]);

        @testDec
        model Foo {}
      `);

      expectDiagnostics(diagnostics, {
        code: "invalid-argument-count",
        message: "Expected at least 1 arguments, but got 0.",
      });
    });

    it("errors if target type is incorrect", async () => {
      const diagnostics = await runner.diagnose(`
        extern dec testDec(target: Union, arg1: StringLiteral);

        @testDec("abc")
        model Foo {}
      `);

      expectDiagnostics(diagnostics, {
        code: "decorator-wrong-target",
        message:
          "Cannot apply @testDec decorator to Foo it is not assignable to Cadl.Reflection.Union",
      });
    });

    it("errors if argument is not assignable to parameter type", async () => {
      const diagnostics = await runner.diagnose(`
        extern dec testDec(target: Type, arg1: StringLiteral);

        @testDec(123)
        model Foo {}
      `);

      expectDiagnostics(diagnostics, {
        code: "invalid-argument",
        message:
          "Argument '123' is not assignable to parameter of type 'Cadl.Reflection.StringLiteral'",
      });
    });

    it("errors if argument is not assignable to rest parameter type", async () => {
      const diagnostics = await runner.diagnose(`
        extern dec testDec(target: Type, ...args: StringLiteral[]);

        @testDec(123, 456)
        model Foo {}
      `);

      expectDiagnostics(diagnostics, [
        {
          code: "invalid-argument",
          message:
            "Argument '123' is not assignable to parameter of type 'Cadl.Reflection.StringLiteral'",
        },
        {
          code: "invalid-argument",
          message:
            "Argument '456' is not assignable to parameter of type 'Cadl.Reflection.StringLiteral'",
        },
      ]);
    });
  });

  it("can have the same name as types", async () => {
    let called = false;
    testHost.addJsFile("test.js", {
      $foo() {
        called = true;
      },
    });

    testHost.addCadlFile(
      "test.cadl",
      `
      import "./test.js";
      model foo { };
      @foo()
      model MyFoo { };
      `
    );

    await testHost.compile("test.cadl");
    ok(called);
  });

  it("doesn't conflict with type bindings at global scope", async () => {
    testHost.addJsFile("test.js", {
      $foo(_: any, __: any, t: any) {},
    });

    testHost.addCadlFile(
      "test.cadl",
      `
      import "./test.js";

      model foo { }
      @foo(foo)
      model Bar { }
      `
    );

    await testHost.diagnose("test.cadl");
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

    testHost.addCadlFile(
      "test.cadl",
      `
      import "./test.js";

      @isBlue
      @blue
      model Foo { };
      `
    );

    await testHost.diagnose("test.cadl");
    ok(result, "expected Foo to be blue in isBlue decorator");
  });
});
