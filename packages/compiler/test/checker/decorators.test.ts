import { deepStrictEqual, ok, strictEqual } from "assert";
import { beforeEach, describe, it } from "vitest";
import {
  DecoratorFunction,
  Namespace,
  PackageFlags,
  isNullType,
  setTypeSpecNamespace,
} from "../../src/core/index.js";
import { numericRanges } from "../../src/core/numeric-ranges.js";
import { Numeric } from "../../src/core/numeric.js";
import {
  BasicTestRunner,
  TestHost,
  createTestHost,
  createTestWrapper,
  expectDiagnostics,
} from "../../src/testing/index.js";
import { mutate } from "../../src/utils/misc.js";

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

    describe("bind implementation to declaration", () => {
      let $otherDec: DecoratorFunction;
      function expectDecorator(ns: Namespace) {
        const otherDecDecorator = ns.decoratorDeclarations.get("otherDec");
        ok(otherDecDecorator);
        strictEqual(otherDecDecorator.implementation, $otherDec);
      }

      describe("with $fn", () => {
        beforeEach(() => {
          $otherDec = () => {};
          testJs.$otherDec = $otherDec;
        });

        it("defined at root", async () => {
          await runner.compile(`
            extern dec otherDec(target: unknown);
          `);

          expectDecorator(runner.program.getGlobalNamespaceType());
        });

        it("in a namespace", async () => {
          setTypeSpecNamespace("Foo.Bar", $otherDec);

          await runner.compile(`
            namespace Foo.Bar {
              extern dec otherDec(target: unknown);
            }
          `);

          const ns = runner.program
            .getGlobalNamespaceType()
            .namespaces.get("Foo")
            ?.namespaces.get("Bar");
          ok(ns);
          expectDecorator(ns);
        });
      });

      describe("with $decorators", () => {
        it("defined at root", async () => {
          testJs.$decorators = { "": { otherDec: $otherDec } };

          await runner.compile(`
            extern dec otherDec(target: unknown);
          `);

          expectDecorator(runner.program.getGlobalNamespaceType());
        });

        it("in a namespace", async () => {
          testJs.$decorators = { "Foo.Bar": { otherDec: $otherDec } };

          await runner.compile(`
            namespace Foo.Bar {
              extern dec otherDec(target: unknown);
            }
          `);

          const ns = runner.program
            .getGlobalNamespaceType()
            .namespaces.get("Foo")
            ?.namespaces.get("Bar");
          ok(ns);
          expectDecorator(ns);
        });
      });
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

    describe("emit deprecated warning if decorator is expecting valueof", () => {
      it.each(["numeric", "int64", "uint64", "integer", "float", "decimal", "decimal128", "null"])(
        "%s",
        async (type) => {
          const diagnostics = await runner.diagnose(`
          extern dec testDec(target: unknown, value: valueof ${type});
        `);
          expectDiagnostics(diagnostics, {
            code: "deprecated",
          });
        }
      );
    });
  });

  describe("usage", () => {
    let runner: BasicTestRunner;
    let calledArgs: any[] | undefined;
    let $flags: PackageFlags;
    beforeEach(() => {
      $flags = {};
      calledArgs = undefined;
      testHost.addJsFile("test.js", {
        $flags,
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
        message: "Argument of type '123' is not assignable to parameter of type 'string'",
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
          message: "Argument of type '123' is not assignable to parameter of type 'string'",
        },
        {
          code: "invalid-argument",
          message: "Argument of type '456' is not assignable to parameter of type 'string'",
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
      async function testCallDecorator(
        type: string,
        value: string,
        suppress?: boolean
      ): Promise<any> {
        mutate($flags).decoratorArgMarshalling = "new";
        await runner.compile(`
          extern dec testDec(target: unknown, arg1: ${type});
          
          ${suppress ? `#suppress "deprecated" "for testing"` : ""}
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
        const explicit: Required<Record<keyof typeof numericRanges, string>> = {
          int8: "number",
          uint8: "number",
          int16: "number",
          uint16: "number",
          int32: "number",
          uint32: "number",
          safeint: "number",
          float32: "number",
          float64: "number",
          // Unsafe to convert to JS Number
          int64: "Numeric",
          uint64: "Numeric",
        };

        const others = [
          ["integer", "Numeric"],
          ["numeric", "Numeric"],
          ["float", "Numeric"],
          ["decimal", "Numeric"],
          ["decimal128", "Numeric"],

          // Union of safe numeric
          ["int8 | int16", "number", "int8(123)"],

          // Union of unsafe numeric
          ["int64 | decimal128", "Numeric", "int8(123)"],

          // Union of safe and unsafe numeric
          ["int64 | float64", "Numeric", "int8(123)"],
        ];

        it.each([...Object.entries(explicit), ...others])(
          "valueof %s marshal to a %s",
          async (type, expectedKind, cstr) => {
            const arg = await testCallDecorator(`valueof ${type}`, cstr ?? `123`);
            if (expectedKind === "number") {
              strictEqual(arg, 123);
            } else {
              deepStrictEqual(arg, Numeric("123"));
            }
          }
        );
      });

      describe("passing a boolean literal", () => {
        it("valueof boolean cast the value to a JS boolean", async () => {
          const arg = await testCallDecorator("valueof boolean", `true`);
          strictEqual(arg, true);
        });
      });

      describe("passing null", () => {
        it("sends null", async () => {
          const arg = await testCallDecorator("valueof null", `null`);
          strictEqual(arg, null);
        });
      });

      describe("passing an object value", () => {
        it("valueof model cast the value to a JS object", async () => {
          const arg = await testCallDecorator("valueof {name: string}", `#{name: "foo"}`);
          deepStrictEqual(arg, { name: "foo" });
        });

        it("valueof model cast the value recursively to a JS object", async () => {
          const arg = await testCallDecorator(
            "valueof {name: unknown}",
            `#{name: #{other: "foo"}}`
          );
          deepStrictEqual(arg, { name: { other: "foo" } });
        });
      });

      describe("passing an array value", () => {
        it("valueof model cast the value to a JS array", async () => {
          const arg = await testCallDecorator("valueof string[]", `#["foo"]`);
          deepStrictEqual(arg, ["foo"]);
        });

        it("valueof model cast the value recursively to a JS object", async () => {
          const arg = await testCallDecorator("valueof unknown[]", `#[#["foo"]]`);
          deepStrictEqual(arg, [["foo"]]);
        });
      });

      // This functionality is to provide a smooth transition from the old way of passing a model/tuple as values
      // It is to be removed in the future.
      describe("legacy type to value casting", () => {
        describe("passing an model gets converted to an object", () => {
          it("valueof model cast the tuple to a JS object", async () => {
            const arg = await testCallDecorator("valueof {name: string}", `{name: "foo"}`, true);
            deepStrictEqual(arg, { name: "foo" });
          });

          it("valueof model cast the tuple recursively to a JS object", async () => {
            const arg = await testCallDecorator(
              "valueof {name: unknown}",
              `{name: {other: "foo"}}`,
              true
            );
            deepStrictEqual(arg, { name: { other: "foo" } });
          });
        });

        describe("passing an tuple gets converted to an object", () => {
          it("valueof model cast the tuple to a JS array", async () => {
            const arg = await testCallDecorator("valueof string[]", `["foo"]`, true);
            deepStrictEqual(arg, ["foo"]);
          });

          it("valueof model cast the tuple recursively to a JS object", async () => {
            const arg = await testCallDecorator("valueof unknown[]", `[["foo"]]`, true);
            deepStrictEqual(arg, [["foo"]]);
          });
        });
      });
    });

    describe("value marshalling (LEGACY)", () => {
      async function testCallDecorator(
        type: string,
        value: string,
        suppress?: boolean
      ): Promise<any> {
        // Default so shouldn't be needed
        // mutate($flags).decoratorArgMarshalling = "legacy";
        await runner.compile(`
          #suppress "deprecated" "for testing"
          extern dec testDec(target: unknown, arg1: ${type});
          
          ${suppress ? `#suppress "deprecated" "for testing"` : ""}
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

      describe("passing a numeric literal is always converted to a number", () => {
        const explicit: Required<Record<keyof typeof numericRanges, string>> = {
          int8: "number",
          uint8: "number",
          int16: "number",
          uint16: "number",
          int32: "number",
          uint32: "number",
          safeint: "number",
          float32: "number",
          float64: "number",
          // Unsafe to convert to JS Number
          int64: "number",
          uint64: "number",
        };

        const others = [
          ["integer", "number"],
          ["numeric", "number"],
          ["float", "number"],
          ["decimal", "number"],
          ["decimal128", "number"],

          // Union of safe numeric
          ["int8 | int16", "number", "int8(123)"],

          // Union of unsafe numeric
          ["int64 | decimal128", "number", "int8(123)"],

          // Union of safe and unsafe numeric
          ["int64 | float64", "number", "int8(123)"],
        ];

        it.each([...Object.entries(explicit), ...others])(
          "valueof %s marshal to a %s",
          async (type, expectedKind, cstr) => {
            const arg = await testCallDecorator(`valueof ${type}`, cstr ?? `123`);
            strictEqual(arg, 123);
          }
        );
      });

      describe("passing a boolean literal", () => {
        it("valueof boolean cast the value to a JS boolean", async () => {
          const arg = await testCallDecorator("valueof boolean", `true`);
          strictEqual(arg, true);
        });
      });

      describe("passing null", () => {
        it("return NullType", async () => {
          const arg = await testCallDecorator("valueof null", `null`);
          ok(isNullType(arg));
        });
      });

      describe("passing an object value", () => {
        it("valueof model cast the value to a JS object", async () => {
          const arg = await testCallDecorator("valueof {name: string}", `#{name: "foo"}`);
          deepStrictEqual(arg, { name: "foo" });
        });

        it("valueof model cast the value recursively to a JS object", async () => {
          const arg = await testCallDecorator(
            "valueof {name: unknown}",
            `#{name: #{other: "foo"}}`
          );
          deepStrictEqual(arg, { name: { other: "foo" } });
        });
      });

      describe("passing an array value", () => {
        it("valueof model cast the value to a JS array", async () => {
          const arg = await testCallDecorator("valueof string[]", `#["foo"]`);
          deepStrictEqual(arg, ["foo"]);
        });

        it("valueof model cast the value recursively to a JS object", async () => {
          const arg = await testCallDecorator("valueof unknown[]", `#[#["foo"]]`);
          deepStrictEqual(arg, [["foo"]]);
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
