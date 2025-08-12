import { ok, strictEqual } from "assert";
import { beforeEach, describe, it } from "vitest";
import { Diagnostic, ModelProperty, Namespace, Type } from "../../src/core/types.js";
import { Program, setTypeSpecNamespace } from "../../src/index.js";
import {
  BasicTestRunner,
  TestHost,
  createTestHost,
  createTestWrapper,
  expectDiagnosticEmpty,
  expectDiagnostics,
} from "../../src/testing/index.js";
import { $ } from "../../src/typekit/index.js";

/** Helper to assert a function declaration was bound to the js implementation */
function expectFunction(ns: Namespace, name: string, impl: any) {
  const fn = ns.functionDeclarations.get(name);
  ok(fn, `Expected function ${name} to be declared.`);
  strictEqual(fn.implementation, impl);
}

describe("compiler: checker: functions", () => {
  let testHost: TestHost;

  beforeEach(async () => {
    testHost = await createTestHost();
  });

  describe("declaration", () => {
    let runner: BasicTestRunner;
    let testJs: Record<string, any>;
    let testImpl: any;
    beforeEach(() => {
      testImpl = (_program: Program) => undefined;
      testJs = { testFn: testImpl };
      testHost.addJsFile("test.js", testJs);
      runner = createTestWrapper(testHost, {
        autoImports: ["./test.js"],
        autoUsings: ["TypeSpec.Reflection"],
      });
    });

    describe("bind implementation to declaration", () => {
      it("defined at root via direct export", async () => {
        await runner.compile(`
          extern fn testFn();
        `);
        expectFunction(runner.program.getGlobalNamespaceType(), "testFn", testImpl);
      });

      it("in a namespace via direct export", async () => {
        setTypeSpecNamespace("Foo.Bar", testImpl);
        await runner.compile(`
          namespace Foo.Bar { extern fn testFn(); }
        `);
        const ns = runner.program
          .getGlobalNamespaceType()
          .namespaces.get("Foo")
          ?.namespaces.get("Bar");
        ok(ns);
        expectFunction(ns, "testFn", testImpl);
      });

      it("defined at root via $functions map", async () => {
        const impl = (_p: Program) => undefined;
        testJs.$functions = { "": { otherFn: impl } };
        await runner.compile(`extern fn otherFn();`);
        expectFunction(runner.program.getGlobalNamespaceType(), "otherFn", impl);
      });

      it("in namespace via $functions map", async () => {
        const impl = (_p: Program) => undefined;
        testJs.$functions = { "Foo.Bar": { nsFn: impl } };
        await runner.compile(`namespace Foo.Bar { extern fn nsFn(); }`);
        const ns = runner.program
          .getGlobalNamespaceType()
          .namespaces.get("Foo")
          ?.namespaces.get("Bar");
        ok(ns);
        expectFunction(ns, "nsFn", impl);
      });
    });

    it("errors if function is missing extern modifier", async () => {
      const diagnostics = await runner.diagnose(`fn testFn();`);
      expectDiagnostics(diagnostics, {
        code: "function-extern",
        message: "A function declaration must be prefixed with the 'extern' modifier.",
      });
    });

    it("errors if extern function is missing implementation", async () => {
      const diagnostics = await runner.diagnose(`extern fn missing();`);
      expectDiagnostics(diagnostics, {
        code: "missing-implementation",
        message: "Extern declaration must have an implementation in JS file.",
      });
    });

    it("errors if rest parameter type is not array", async () => {
      const diagnostics = await runner.diagnose(`extern fn f(...rest: string);`);
      expectDiagnostics(diagnostics, [
        {
          code: "missing-implementation",
          message: "Extern declaration must have an implementation in JS file.",
        },
        {
          code: "rest-parameter-array",
          message: "A rest parameter must be of an array type.",
        },
      ]);
    });
  });

  describe("usage", () => {
    let runner: BasicTestRunner;
    let calledArgs: any[] | undefined;
    beforeEach(() => {
      calledArgs = undefined;
      testHost.addJsFile("test.js", {
        testFn(program: Program, a: any, b: any, ...rest: any[]) {
          calledArgs = [program, a, b, ...rest];
          return a; // Return first arg
        },
        sum(program: Program, ...nums: number[]) {
          return nums.reduce((a, b) => a + b, 0);
        },
        valFirst(program: Program, v: any) {
          return v;
        },
      });
      runner = createTestWrapper(testHost, {
        autoImports: ["./test.js"],
        autoUsings: ["TypeSpec.Reflection"],
      });
    });

    function expectCalledWith(...args: any[]) {
      ok(calledArgs, "Function was not called.");
      strictEqual(calledArgs.length, 1 + args.length);
      for (const [i, v] of args.entries()) {
        strictEqual(calledArgs[1 + i], v);
      }
    }

    it("errors if function not declared", async () => {
      const diagnostics = await runner.diagnose(`const X = missing();`);
      expectDiagnostics(diagnostics, {
        code: "invalid-ref",
        message: "Unknown identifier missing",
      });
    });

    it("calls function with arguments", async () => {
      await runner.compile(
        `extern fn testFn(a: valueof string, b?: valueof string, ...rest: valueof string[]): valueof string; const X = testFn("one", "two", "three");`,
      );
      expectCalledWith("one", "two", "three"); // program + args, optional b provided
    });

    it("allows omitting optional param", async () => {
      await runner.compile(
        `extern fn testFn(a: valueof string, b?: valueof string, ...rest: valueof string[]): valueof string; const X = testFn("one");`,
      );
      expectCalledWith("one", undefined);
    });

    it("allows zero args for rest-only", async () => {
      await runner.compile(
        `extern fn sum(...nums: valueof int32[]): valueof int32; const S = sum();`,
      );
    });

    it("errors if not enough args", async () => {
      const diagnostics = await runner.diagnose(
        `extern fn testFn(a: valueof string, b: valueof string): valueof string; const X = testFn("one");`,
      );
      expectDiagnostics(diagnostics, {
        code: "invalid-argument-count",
        message: "Expected at least 2 arguments, but got 1.",
      });
    });

    it("errors if too many args", async () => {
      const diagnostics = await runner.diagnose(
        `extern fn testFn(a: valueof string): valueof string; const X = testFn("one", "two");`,
      );
      expectDiagnostics(diagnostics, {
        code: "invalid-argument-count",
        message: "Expected 1 arguments, but got 2.",
      });
    });

    it("errors if too few with rest", async () => {
      const diagnostics = await runner.diagnose(
        `extern fn testFn(a: string, ...rest: string[]); alias X = testFn();`,
      );
      expectDiagnostics(diagnostics, {
        code: "invalid-argument-count",
        message: "Expected at least 1 arguments, but got 0.",
      });
    });

    it("errors if argument type mismatch (value)", async () => {
      const diagnostics = await runner.diagnose(
        `extern fn valFirst(a: valueof string): valueof string; const X = valFirst(123);`,
      );
      expectDiagnostics(diagnostics, {
        code: "unassignable",
        message: "Type '123' is not assignable to type 'string'",
      });
    });

    it("errors if passing type where value expected", async () => {
      const diagnostics = await runner.diagnose(
        `extern fn valFirst(a: valueof string): valueof string; const X = valFirst(string);`,
      );
      expectDiagnostics(diagnostics, {
        code: "expect-value",
        message: "string refers to a type, but is being used as a value here.",
      });
    });

    it("accepts string literal for type param", async () => {
      const diagnostics = await runner.diagnose(
        `extern fn testFn(a: string); alias X = testFn("abc");`,
      );
      expectDiagnosticEmpty(diagnostics);
    });

    it("accepts arguments matching rest", async () => {
      const diagnostics = await runner.diagnose(
        `extern fn testFn(a: string, ...rest: string[]); alias X = testFn("a", "b", "c");`,
      );
      expectDiagnosticEmpty(diagnostics);
    });
  });

  describe("referencing result type", () => {
    it("can use function result in alias", async () => {
      testHost.addJsFile("test.js", {
        makeArray(program: Program, t: Type) {
          return $(program).array.create(t);
        },
      });
      const runner = createTestWrapper(testHost, {
        autoImports: ["./test.js"],
        autoUsings: ["TypeSpec.Reflection"],
      });
      const [{ prop }, diagnostics] = (await runner.compileAndDiagnose(`
        extern fn makeArray(T: Reflection.Type);
        
        alias X = makeArray(string);

        model M {
          @test prop: X;
        }
      `)) as [{ prop: ModelProperty }, Diagnostic[]];
      expectDiagnosticEmpty(diagnostics);

      ok(prop.type);
      ok($(runner.program).array.is(prop.type));

      const arrayIndexerType = prop.type.indexer.value;

      ok(arrayIndexerType);
      ok($(runner.program).scalar.isString(arrayIndexerType));
    });
  });
});
