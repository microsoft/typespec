import { deepStrictEqual, ok, strictEqual } from "assert";
import { beforeEach, describe, it } from "vitest";
import { numericRanges } from "../../src/core/numeric-ranges.js";
import { Numeric } from "../../src/core/numeric.js";
import {
  DecoratorContext,
  DecoratorFunction,
  Model,
  setTypeSpecNamespace,
} from "../../src/index.js";
import { expectDiagnostics, mockFile, t } from "../../src/testing/index.js";
import { Tester } from "../tester.js";

const DecTester = Tester.files({
  "test.js": mockFile.js({ $testDec: () => {} }),
})
  .import("./test.js")
  .using("TypeSpec.Reflection");

describe("compiler: checker: decorators", () => {
  describe("declaration", () => {
    describe("bind implementation to declaration", () => {
      describe("with $fn", () => {
        it("defined at root", async () => {
          const $otherDec: DecoratorFunction = () => {};
          const { program } = await Tester.files({
            "test.js": mockFile.js({
              $testDec: () => {},
              $otherDec,
            }),
          })
            .import("./test.js")
            .using("TypeSpec.Reflection").compile(`
              extern dec otherDec(target: unknown);
            `);

          const otherDecDecorator = program
            .getGlobalNamespaceType()
            .decoratorDeclarations.get("otherDec");
          ok(otherDecDecorator);
          strictEqual(otherDecDecorator.implementation, $otherDec);
        });

        it("in a namespace", async () => {
          const $otherDec: DecoratorFunction = () => {};
          setTypeSpecNamespace("Foo.Bar", $otherDec);

          const { program } = await Tester.files({
            "test.js": mockFile.js({
              $testDec: () => {},
              $otherDec,
            }),
          })
            .import("./test.js")
            .using("TypeSpec.Reflection").compile(`
              namespace Foo.Bar {
                extern dec otherDec(target: unknown);
              }
            `);

          const ns = program.getGlobalNamespaceType().namespaces.get("Foo")?.namespaces.get("Bar");
          ok(ns);
          const otherDecDecorator = ns.decoratorDeclarations.get("otherDec");
          ok(otherDecDecorator);
          strictEqual(otherDecDecorator.implementation, $otherDec);
        });
      });

      describe("with $decorators", () => {
        it("defined at root", async () => {
          const $otherDec: DecoratorFunction = () => {};
          const { program } = await Tester.files({
            "test.js": mockFile.js({
              $testDec: () => {},
              $decorators: { "": { otherDec: $otherDec } },
            }),
          })
            .import("./test.js")
            .using("TypeSpec.Reflection").compile(`
              extern dec otherDec(target: unknown);
            `);

          const otherDecDecorator = program
            .getGlobalNamespaceType()
            .decoratorDeclarations.get("otherDec");
          ok(otherDecDecorator);
          strictEqual(otherDecDecorator.implementation, $otherDec);
        });

        it("in a namespace", async () => {
          const $otherDec: DecoratorFunction = () => {};
          const { program } = await Tester.files({
            "test.js": mockFile.js({
              $testDec: () => {},
              $decorators: { "Foo.Bar": { otherDec: $otherDec } },
            }),
          })
            .import("./test.js")
            .using("TypeSpec.Reflection").compile(`
              namespace Foo.Bar {
                extern dec otherDec(target: unknown);
              }
            `);

          const ns = program.getGlobalNamespaceType().namespaces.get("Foo")?.namespaces.get("Bar");
          ok(ns);
          const otherDecDecorator = ns.decoratorDeclarations.get("otherDec");
          ok(otherDecDecorator);
          strictEqual(otherDecDecorator.implementation, $otherDec);
        });
      });
    });

    it("errors if decorator is missing extern or auto modifier", async () => {
      const diagnostics = await DecTester.diagnose(`
        dec testDec(target: unknown);
      `);
      expectDiagnostics(diagnostics, {
        code: "invalid-modifier",
        message:
          "Declaration of type 'dec' is missing one of the required modifiers: 'extern' or 'auto'.",
      });
    });

    it("errors if both extern and auto modifiers are used", async () => {
      const diagnostics = await DecTester.diagnose(`
        auto extern dec testDec(target: unknown);
      `);
      expectDiagnostics(diagnostics, [
        {
          code: "invalid-modifier",
          message: "Modifiers 'extern' and 'auto' cannot be used together.",
        },
        {
          code: "auto-decorator-disabled",
        },
      ]);
    });

    it("errors if auto modifier is used on a model declaration", async () => {
      const diagnostics = await DecTester.diagnose(`
        auto model Foo {}
      `);
      expectDiagnostics(diagnostics, {
        code: "invalid-modifier",
        message: "Modifier 'auto' cannot be used on declarations of type 'model'.",
      });
    });

    it("errors if auto modifier is used on a function declaration", async () => {
      const diagnostics = await DecTester.diagnose(`
        auto extern fn foo(): void;
      `);
      expectDiagnostics(
        diagnostics.filter((d) => d.code === "invalid-modifier"),
        {
          code: "invalid-modifier",
          message: "Modifier 'auto' cannot be used on declarations of type 'function'.",
        },
      );
    });

    it("errors if rest parameter type is not an array expression", async () => {
      const diagnostics = await DecTester.diagnose(`
        extern dec testDec(target: unknown, ...rest: string);
      `);
      expectDiagnostics(diagnostics, {
        code: "rest-parameter-array",
        message: "A rest parameter must be of an array type.",
      });
    });

    it("errors if extern decorator is missing implementation", async () => {
      const diagnostics = await DecTester.diagnose(`
        extern dec notImplemented(target: unknown);
      `);
      expectDiagnostics(diagnostics, {
        code: "missing-implementation",
        message: "Extern declaration must have an implementation in JS file.",
      });
    });
  });

  describe("auto decorators", () => {
    const autoDecOptions = {
      compilerOptions: {
        configFile: {
          projectRoot: ".",
          kind: "project" as const,
          features: ["auto-decorators"],
          diagnostics: [] as any[],
          outputDir: "tsp-output",
        },
      },
    };

    it("auto decorator does not require an implementation", async () => {
      const { program } = await Tester.using("TypeSpec.Reflection").compile(
        `
        auto dec myFlag(target: Model);
      `,
        autoDecOptions,
      );

      const dec = program.getGlobalNamespaceType().decoratorDeclarations.get("myFlag");
      ok(dec);
      strictEqual(dec.declarationKind, "auto");
      ok(dec.implementation, "should have auto-generated implementation");
    });

    it("auto decorator with no args stores empty record in stateMap", async () => {
      const { program } = await Tester.using("TypeSpec.Reflection").compile(
        `
        auto dec myFlag(target: Model);

        @myFlag
        model Foo {}
      `,
        autoDecOptions,
      );

      const Foo = program.getGlobalNamespaceType().models.get("Foo")!;
      ok(Foo, "Foo should exist");
      const { getAutoDecoratorValue } = await import("../../src/lib/auto-decorator.js");
      deepStrictEqual(getAutoDecoratorValue(program, "myFlag", Foo), {});
    });

    it("auto decorator with single arg stores as key-value record in stateMap", async () => {
      const { program } = await Tester.using("TypeSpec.Reflection").compile(
        `
        auto dec myLabel(target: Model, label: valueof string);

        @myLabel("hello")
        model Foo {}
      `,
        autoDecOptions,
      );

      const Foo = program.getGlobalNamespaceType().models.get("Foo")!;
      const { getAutoDecoratorValue } = await import("../../src/lib/auto-decorator.js");
      deepStrictEqual(getAutoDecoratorValue(program, "myLabel", Foo), { label: "hello" });
    });

    it("auto decorator with multiple args stores named record in stateMap", async () => {
      const { program } = await Tester.using("TypeSpec.Reflection").compile(
        `
        auto dec myMeta(target: Model, name: valueof string, version: valueof int32);

        @myMeta("test", 42)
        model Foo {}
      `,
        autoDecOptions,
      );

      const Foo = program.getGlobalNamespaceType().models.get("Foo")!;
      const { getAutoDecoratorValue } = await import("../../src/lib/auto-decorator.js");
      const value = getAutoDecoratorValue(program, "myMeta", Foo) as any;
      deepStrictEqual(value, { name: "test", version: 42 });
    });

    it("auto decorator in namespace uses FQN for state key", async () => {
      const { program } = await Tester.using("TypeSpec.Reflection").compile(
        `
        namespace MyLib {
          auto dec myLabel(target: Model, label: valueof string);
        }

        @MyLib.myLabel("world")
        model Foo {}
      `,
        autoDecOptions,
      );

      const Foo = program.getGlobalNamespaceType().models.get("Foo")!;
      const { getAutoDecoratorValue } = await import("../../src/lib/auto-decorator.js");
      deepStrictEqual(getAutoDecoratorValue(program, "MyLib.myLabel", Foo), { label: "world" });
    });

    it("internal auto dec is valid", async () => {
      const diagnostics = await Tester.using("TypeSpec.Reflection").diagnose(
        `
        internal auto dec myDec(target: unknown);
      `,
        autoDecOptions,
      );
      strictEqual(diagnostics.length, 0);
    });

    it("emits error without feature flag", async () => {
      const diagnostics = await Tester.using("TypeSpec.Reflection").diagnose(`
        auto dec myFlag(target: Model);
      `);
      expectDiagnostics(diagnostics, {
        code: "auto-decorator-disabled",
        message: /Auto decorator declarations require the 'auto-decorators' feature to be enabled/,
      });
    });

    it("auto decorator with rest params stores as array in record", async () => {
      const { program } = await Tester.using("TypeSpec.Reflection").compile(
        `
        auto dec tags(target: Model, ...tags: valueof string[]);

        @tags("a", "b", "c")
        model Foo {}
      `,
        autoDecOptions,
      );

      const Foo = program.getGlobalNamespaceType().models.get("Foo")!;
      const { getAutoDecoratorValue } = await import("../../src/lib/auto-decorator.js");
      deepStrictEqual(getAutoDecoratorValue(program, "tags", Foo), { tags: ["a", "b", "c"] });
    });

    it("auto decorator with mixed params and rest stores correctly", async () => {
      const { program } = await Tester.using("TypeSpec.Reflection").compile(
        `
        auto dec route(target: Model, path: valueof string, ...tags: valueof string[]);

        @route("/foo", "tag1", "tag2")
        model Foo {}
      `,
        autoDecOptions,
      );

      const Foo = program.getGlobalNamespaceType().models.get("Foo")!;
      const { getAutoDecoratorValue } = await import("../../src/lib/auto-decorator.js");
      deepStrictEqual(getAutoDecoratorValue(program, "route", Foo), {
        path: "/foo",
        tags: ["tag1", "tag2"],
      });
    });

    it("emits duplicate-decorator warning when applied twice on same node", async () => {
      const diagnostics = await Tester.using("TypeSpec.Reflection").diagnose(
        `
        auto dec myFlag(target: Model);

        @myFlag
        @myFlag
        model Foo {}
      `,
        autoDecOptions,
      );
      expectDiagnostics(diagnostics, [
        {
          code: "duplicate-decorator",
          message: /Decorator @myFlag cannot be used twice on the same declaration/,
        },
        {
          code: "duplicate-decorator",
          message: /Decorator @myFlag cannot be used twice on the same declaration/,
        },
      ]);
    });

    it("duplicate auto decorators on same node are last-write-wins", async () => {
      const { program } = await Tester.using("TypeSpec.Reflection").compile(
        `
        auto dec myLabel(target: Model, label: valueof string);

        #suppress "duplicate-decorator" "testing last-write-wins"
        @myLabel("first")
        @myLabel("second")
        model Foo {}
      `,
        autoDecOptions,
      );

      // Decorators execute in reverse source order, so the source-first
      // application runs last and wins (both applications still store).
      const Foo = program.getGlobalNamespaceType().models.get("Foo")!;
      const { getAutoDecoratorValue } = await import("../../src/lib/auto-decorator.js");
      deepStrictEqual(getAutoDecoratorValue(program, "myLabel", Foo), { label: "first" });
    });

    it("augment decorator overwrites auto decorator value (last-write-wins)", async () => {
      const { program } = await Tester.using("TypeSpec.Reflection").compile(
        `
        auto dec myLabel(target: Model, label: valueof string);

        @myLabel("first")
        model Foo {}

        @@myLabel(Foo, "second");
      `,
        autoDecOptions,
      );

      const Foo = program.getGlobalNamespaceType().models.get("Foo")!;
      const { getAutoDecoratorValue } = await import("../../src/lib/auto-decorator.js");
      deepStrictEqual(getAutoDecoratorValue(program, "myLabel", Foo), { label: "second" });
    });

    it("auto decorator with optional param stores undefined for missing arg", async () => {
      const { program } = await Tester.using("TypeSpec.Reflection").compile(
        `
        auto dec myDec(target: Model, required: valueof string, optional?: valueof int32);

        @myDec("hello")
        model Foo {}
      `,
        autoDecOptions,
      );

      const Foo = program.getGlobalNamespaceType().models.get("Foo")!;
      const { getAutoDecoratorValue } = await import("../../src/lib/auto-decorator.js");
      deepStrictEqual(getAutoDecoratorValue(program, "myDec", Foo), {
        required: "hello",
        optional: undefined,
      });
    });

    it("getAutoDecoratorTargets returns all targets", async () => {
      const { program } = await Tester.using("TypeSpec.Reflection").compile(
        `
        auto dec tracked(target: Model);

        @tracked model Foo {}
        @tracked model Bar {}
      `,
        autoDecOptions,
      );

      const { getAutoDecoratorTargets } = await import("../../src/lib/auto-decorator.js");
      const targets = getAutoDecoratorTargets(program, "tracked");
      strictEqual(targets.size, 2);
    });

    it("hasAutoDecorator reflects whether the decorator was applied", async () => {
      const { program } = await Tester.using("TypeSpec.Reflection").compile(
        `
        auto dec tracked(target: Model);

        @tracked model Foo {}
        model Bar {}
      `,
        autoDecOptions,
      );

      const ns = program.getGlobalNamespaceType();
      const { hasAutoDecorator } = await import("../../src/lib/auto-decorator.js");
      strictEqual(hasAutoDecorator(program, "tracked", ns.models.get("Foo")!), true);
      strictEqual(hasAutoDecorator(program, "tracked", ns.models.get("Bar")!), false);
    });

    it("getAutoDecoratorValue returns undefined when not applied", async () => {
      const { program } = await Tester.using("TypeSpec.Reflection").compile(
        `
        auto dec myLabel(target: Model, label: valueof string);

        model Bar {}
      `,
        autoDecOptions,
      );

      const Bar = program.getGlobalNamespaceType().models.get("Bar")!;
      const { getAutoDecoratorValue } = await import("../../src/lib/auto-decorator.js");
      strictEqual(getAutoDecoratorValue(program, "myLabel", Bar), undefined);
    });

    it("auto decorator is inherited through `is`", async () => {
      const { program } = await Tester.using("TypeSpec.Reflection").compile(
        `
        auto dec myLabel(target: Model, label: valueof string);

        @myLabel("base")
        model Base {}

        model Derived is Base {}
      `,
        autoDecOptions,
      );

      const ns = program.getGlobalNamespaceType();
      const { getAutoDecoratorValue } = await import("../../src/lib/auto-decorator.js");
      deepStrictEqual(getAutoDecoratorValue(program, "myLabel", ns.models.get("Base")!), {
        label: "base",
      });
      deepStrictEqual(getAutoDecoratorValue(program, "myLabel", ns.models.get("Derived")!), {
        label: "base",
      });
    });

    it("auto decorator works on a non-Model target (ModelProperty)", async () => {
      const { program } = await Tester.using("TypeSpec.Reflection").compile(
        `
        auto dec field(target: ModelProperty, name: valueof string);

        model Foo {
          @field("id")
          prop: string;
        }
      `,
        autoDecOptions,
      );

      const prop = program.getGlobalNamespaceType().models.get("Foo")!.properties.get("prop")!;
      const { getAutoDecoratorValue } = await import("../../src/lib/auto-decorator.js");
      deepStrictEqual(getAutoDecoratorValue(program, "field", prop), { name: "id" });
    });
  });

  describe("usage", () => {
    let calledArgs: any[] | undefined;
    const UsageTester = Tester.files({
      "test.js": mockFile.js({
        $flags: {},
        $testDec: (...args: any[]) => (calledArgs = args),
      }),
    })
      .import("./test.js")
      .using("TypeSpec.Reflection");

    beforeEach(() => {
      calledArgs = undefined;
    });

    function expectDecoratorCalledWith(program: any, target: unknown, ...args: unknown[]) {
      ok(calledArgs, "Decorator was not called.");
      strictEqual(calledArgs.length, 2 + args.length);
      strictEqual(calledArgs[0].program, program);
      strictEqual(calledArgs[1], target);
      for (const [index, arg] of args.entries()) {
        strictEqual(calledArgs[2 + index], arg);
      }
    }

    function expectDecoratorNotCalled() {
      strictEqual(calledArgs, undefined);
    }

    it("calls a decorator with no argument", async () => {
      const { Foo, program } = await UsageTester.compile(t.code`
        extern dec testDec(target: unknown);

        @testDec
        model ${t.model("Foo")} {}
      `);

      expectDecoratorCalledWith(program, Foo);
    });

    it("calls a decorator with arguments", async () => {
      const { Foo, program } = await UsageTester.compile(t.code`
        extern dec testDec(target: unknown, arg1: valueof string, arg2: valueof string);

        @testDec("one", "two")
        model ${t.model("Foo")} {}
      `);

      expectDecoratorCalledWith(program, Foo, "one", "two");
    });

    it("calls a decorator with optional arguments", async () => {
      const { Foo, program } = await UsageTester.compile(t.code`
        extern dec testDec(target: unknown, arg1: valueof string, arg2?: valueof string);

        @testDec("one")
        model ${t.model("Foo")} {}
      `);

      expectDecoratorCalledWith(program, Foo, "one");
    });

    it("calls a decorator with rest arguments", async () => {
      const { Foo, program } = await UsageTester.compile(t.code`
        extern dec testDec(target: unknown, arg1: valueof string, ...args: valueof string[]);

        @testDec("one", "two", "three", "four")
        model ${t.model("Foo")} {}
      `);

      expectDecoratorCalledWith(program, Foo, "one", "two", "three", "four");
    });

    it("errors if not calling with enough arguments", async () => {
      const diagnostics = await UsageTester.diagnose(`
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
      const [{ Foo, program }, diagnostics] = await UsageTester.compileAndDiagnose(t.code`
        extern dec testDec(target: unknown, arg1: valueof string, arg2?: valueof string);

        @testDec("one", "two", "three")
        model ${t.model("Foo")} {}
      `);

      expectDiagnostics(diagnostics, {
        code: "invalid-argument-count",
        message: "Expected 1-2 arguments, but got 3.",
      });
      expectDecoratorCalledWith(program, Foo, "one", "two");
    });

    it("errors if not calling with argument and decorator expect none", async () => {
      const diagnostics = await UsageTester.diagnose(`
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
      const diagnostics = await UsageTester.diagnose(`
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
      const diagnostics = await UsageTester.diagnose(`
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
      const diagnostics = await UsageTester.diagnose(`
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
      const diagnostics = await UsageTester.diagnose(`
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
      await UsageTester.compile(`
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
        suppress?: boolean,
      ): Promise<any> {
        await UsageTester.compile(`
          extern dec testDec(target: unknown, arg1: ${type});
          
          ${suppress ? `#suppress "deprecated" "for testing"` : ""}
          @testDec(${value})
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
            '"Start ${"one"} middle ${"two"} end"',
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
          },
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
            `#{name: #{other: "foo"}}`,
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
    await Tester.files({
      "test.js": mockFile.js({
        $foo() {
          called = true;
        },
      }),
    }).import("./test.js").compile(`
        model foo { };
        @foo()
        model MyFoo { };
      `);
    ok(called);
  });

  it("doesn't conflict with type bindings at global scope", async () => {
    await Tester.files({
      "test.js": mockFile.js({
        $foo(_: any, __: any, t: any) {},
      }),
    }).import("./test.js").diagnose(`
        model foo { }
        @foo(foo)
        model Bar { }
      `);
  });

  it("evaluates in outside-in order", async () => {
    let result = false;
    let blueThing: any;

    await Tester.files({
      "test.js": mockFile.js({
        $blue(_: any, t: any) {
          blueThing = t;
        },
        $isBlue(_: any, t: any) {
          result = blueThing === t;
        },
      }),
    }).import("./test.js").diagnose(`
        @isBlue
        @blue
        model Foo { };
      `);
    ok(result, "expected Foo to be blue in isBlue decorator");
  });
});

describe("validators", () => {
  async function testerForDecorator(fn: DecoratorFunction) {
    return await Tester.files({
      "dec.tsp": `
        import "./dec.js";
        namespace MyLibrary;
        extern dec myDecorator(target: unknown);
      `,
      "dec.js": mockFile.js({
        $decorators: {
          MyLibrary: {
            myDecorator: fn,
          },
        },
      }),
    })
      .import("./dec.tsp")
      .using("MyLibrary");
  }

  it("postSelf apply validator after checking the type", async () => {
    const order: string[] = [];
    const tester = await testerForDecorator((_: DecoratorContext, target: Model) => {
      order.push(`apply(${target.name})`);
      return {
        onTargetFinish: () => {
          order.push(`validate(${target.name})`);
          return [];
        },
      };
    });
    await tester.compile(`
      @myDecorator
      @myDecorator
      model A {}  
      @myDecorator
      @myDecorator
      model B {}  
    `);
    deepStrictEqual(order, [
      `apply(A)`,
      `apply(A)`,
      `validate(A)`,
      `validate(A)`,
      `apply(B)`,
      `apply(B)`,
      `validate(B)`,
      `validate(B)`,
    ]);
  });

  it("post apply validator after checking every type", async () => {
    const order: string[] = [];
    const tester = await testerForDecorator((_: DecoratorContext, target: Model) => {
      order.push(`apply(${target.name})`);
      return {
        onGraphFinish: () => {
          order.push(`validate(${target.name})`);
          return [];
        },
      };
    });
    await tester.compile(`
      @myDecorator
      @myDecorator
      model A {}  
      @myDecorator
      @myDecorator
      model B {}  
    `);
    deepStrictEqual(order, [
      `apply(A)`,
      `apply(A)`,
      `apply(B)`,
      `apply(B)`,
      `validate(A)`,
      `validate(A)`,
      `validate(B)`,
      `validate(B)`,
    ]);
  });
});
