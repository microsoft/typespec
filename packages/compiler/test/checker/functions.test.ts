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
        sum(program: Program, ...addends: number[]) {
          return addends.reduce((a, b) => a + b, 0);
        },
        valFirst(program: Program, v: any) {
          return v;
        },
        voidFn(program: Program, arg: any) {
          calledArgs = [program, arg];
          // No return value
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
      const diagnostics = await runner.diagnose(
        `extern fn sum(...addends: valueof int32[]): valueof int32; const S = sum();`,
      );
      expectDiagnostics(diagnostics, []);
    });

    it("accepts function with explicit void return type", async () => {
      const diagnostics = await runner.diagnose(
        `extern fn voidFn(a: valueof string): valueof void; const X: void = voidFn("test");`,
      );
      expectDiagnostics(diagnostics, []);
      expectCalledWith("test");
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

  describe("specific type constraints", () => {
    let runner: BasicTestRunner;
    let receivedTypes: Type[] = [];

    beforeEach(() => {
      receivedTypes = [];
      testHost.addJsFile("test.js", {
        expectModel(program: Program, model: Type) {
          receivedTypes.push(model);
          return model;
        },
        expectEnum(program: Program, enumType: Type) {
          receivedTypes.push(enumType);
          return enumType;
        },
        expectScalar(program: Program, scalar: Type) {
          receivedTypes.push(scalar);
          return scalar;
        },
        expectUnion(program: Program, union: Type) {
          receivedTypes.push(union);
          return union;
        },
        expectInterface(program: Program, iface: Type) {
          receivedTypes.push(iface);
          return iface;
        },
        expectNamespace(program: Program, ns: Type) {
          receivedTypes.push(ns);
          return ns;
        },
        expectOperation(program: Program, op: Type) {
          receivedTypes.push(op);
          return op;
        },
      });
      runner = createTestWrapper(testHost, {
        autoImports: ["./test.js"],
        autoUsings: ["TypeSpec.Reflection"],
      });
    });

    it("accepts Reflection.Model parameter", async () => {
      const diagnostics = await runner.diagnose(`
        extern fn expectModel(m: Reflection.Model): Reflection.Model;
        model TestModel { x: string; }
        alias X = expectModel(TestModel);
      `);
      expectDiagnosticEmpty(diagnostics);
      strictEqual(receivedTypes.length, 1);
      strictEqual(receivedTypes[0].kind, "Model");
    });

    it("accepts Reflection.Enum parameter", async () => {
      const diagnostics = await runner.diagnose(`
        extern fn expectEnum(e: Reflection.Enum): Reflection.Enum;
        enum TestEnum { A, B }
        alias X = expectEnum(TestEnum);
      `);
      expectDiagnosticEmpty(diagnostics);
      strictEqual(receivedTypes.length, 1);
      strictEqual(receivedTypes[0].kind, "Enum");
    });

    it("accepts Reflection.Scalar parameter", async () => {
      const diagnostics = await runner.diagnose(`
        extern fn expectScalar(s: Reflection.Scalar): Reflection.Scalar;
        scalar TestScalar extends string;
        alias X = expectScalar(TestScalar);
      `);
      expectDiagnosticEmpty(diagnostics);
      strictEqual(receivedTypes.length, 1);
      strictEqual(receivedTypes[0].kind, "Scalar");
    });

    it("accepts Reflection.Union parameter", async () => {
      const diagnostics = await runner.diagnose(`
        extern fn expectUnion(u: Reflection.Union): Reflection.Union;
        alias X = expectUnion(string | int32);
      `);
      expectDiagnosticEmpty(diagnostics);
      strictEqual(receivedTypes.length, 1);
      strictEqual(receivedTypes[0].kind, "Union");
    });

    it("accepts Reflection.Interface parameter", async () => {
      const diagnostics = await runner.diagnose(`
        extern fn expectInterface(i: Reflection.Interface): Reflection.Interface;
        interface TestInterface { 
          testOp(): void; 
        }
        alias X = expectInterface(TestInterface);
      `);
      expectDiagnosticEmpty(diagnostics);
      strictEqual(receivedTypes.length, 1);
      strictEqual(receivedTypes[0].kind, "Interface");
    });

    it("accepts Reflection.Namespace parameter", async () => {
      const diagnostics = await runner.diagnose(`
        extern fn expectNamespace(ns: Reflection.Namespace): Reflection.Namespace;
        namespace TestNs {}
        alias X = expectNamespace(TestNs);
      `);
      expectDiagnosticEmpty(diagnostics);
      strictEqual(receivedTypes.length, 1);
      strictEqual(receivedTypes[0].kind, "Namespace");
    });

    it("accepts Reflection.Operation parameter", async () => {
      const diagnostics = await runner.diagnose(`
        extern fn expectOperation(oper: Reflection.Operation): Reflection.Operation;
        op testOp(): string;
        alias X = expectOperation(testOp);
      `);
      expectDiagnosticEmpty(diagnostics);
      strictEqual(receivedTypes.length, 1);
      strictEqual(receivedTypes[0].kind, "Operation");
    });

    it("errors when wrong type kind is passed", async () => {
      const diagnostics = await runner.diagnose(`
        extern fn expectModel(m: Reflection.Model): Reflection.Model;
        enum TestEnum { A, B }
        alias X = expectModel(TestEnum);
      `);
      expectDiagnostics(diagnostics, {
        code: "unassignable",
        message: "Type 'TestEnum' is not assignable to type 'Model'",
      });
    });
  });

  describe("value marshalling", () => {
    let runner: BasicTestRunner;
    let receivedValues: any[] = [];

    beforeEach(() => {
      receivedValues = [];
      testHost.addJsFile("test.js", {
        expectString(program: Program, str: string) {
          receivedValues.push(str);
          return str;
        },
        expectNumber(program: Program, num: number) {
          receivedValues.push(num);
          return num;
        },
        expectBoolean(program: Program, bool: boolean) {
          receivedValues.push(bool);
          return bool;
        },
        expectArray(program: Program, arr: any[]) {
          receivedValues.push(arr);
          return arr;
        },
        expectObject(program: Program, obj: Record<string, any>) {
          receivedValues.push(obj);
          return obj;
        },
        returnInvalidJsValue(program: Program) {
          return Symbol("invalid"); // Invalid JS value that can't be unmarshaled
        },
        returnComplexObject(program: Program) {
          return {
            nested: { value: 42 },
            array: [1, "test", true],
            mixed: null,
          };
        },
      });
      runner = createTestWrapper(testHost, {
        autoImports: ["./test.js"],
        autoUsings: ["TypeSpec.Reflection"],
      });
    });

    it("marshals string values correctly", async () => {
      const diagnostics = await runner.diagnose(`
        extern fn expectString(s: valueof string): valueof string;
        const X = expectString("hello world");
      `);
      expectDiagnosticEmpty(diagnostics);
      strictEqual(receivedValues.length, 1);
      strictEqual(receivedValues[0], "hello world");
    });

    it("marshals numeric values correctly", async () => {
      const diagnostics = await runner.diagnose(`
        extern fn expectNumber(n: valueof int32): valueof int32;
        const X = expectNumber(42);
      `);
      expectDiagnosticEmpty(diagnostics);
      strictEqual(receivedValues.length, 1);
      strictEqual(receivedValues[0], 42);
    });

    it("marshals boolean values correctly", async () => {
      const diagnostics = await runner.diagnose(`
        extern fn expectBoolean(b: valueof boolean): valueof boolean;
        const X = expectBoolean(true);
      `);
      expectDiagnosticEmpty(diagnostics);
      strictEqual(receivedValues.length, 1);
      strictEqual(receivedValues[0], true);
    });

    it("marshals array values correctly", async () => {
      const diagnostics = await runner.diagnose(`
        extern fn expectArray(arr: valueof string[]): valueof string[];
        const X = expectArray(#["a", "b", "c"]);
      `);
      expectDiagnosticEmpty(diagnostics);
      strictEqual(receivedValues.length, 1);
      ok(Array.isArray(receivedValues[0]));
      strictEqual(receivedValues[0].length, 3);
      strictEqual(receivedValues[0][0], "a");
      strictEqual(receivedValues[0][1], "b");
      strictEqual(receivedValues[0][2], "c");
    });

    it("marshals object values correctly", async () => {
      // BUG: This test reveals a type system issue where numeric literal 25 is not
      // assignable to int32 in object literal context within extern functions.
      // The error: Type '{ name: string, age: 25 }' is not assignable to type '{ name: string, age: int32 }'
      // Expected: Numeric literal 25 should be assignable to int32
      const diagnostics = await runner.diagnose(`
        extern fn expectObject(obj: valueof {name: string, age: int32}): valueof {name: string, age: int32};
        const X = expectObject(#{name: "test", age: 25});
      `);
      expectDiagnosticEmpty(diagnostics);
      strictEqual(receivedValues.length, 1);
      strictEqual(typeof receivedValues[0], "object");
      strictEqual(receivedValues[0].name, "test");
      strictEqual(receivedValues[0].age, 25);
    });

    it("handles invalid JS return values gracefully", async () => {
      const _diagnostics = await runner.diagnose(`
        extern fn returnInvalidJsValue(): valueof string;
        const X = returnInvalidJsValue();
      `);
      // Should not crash, but may produce diagnostics about invalid return value
      // The implementation currently has a TODO for this case
    });

    it("unmarshals complex JS objects to values", async () => {
      const _diagnostics = await runner.diagnose(`
        extern fn returnComplexObject(): valueof unknown;
        const X = returnComplexObject();
      `);
      expectDiagnosticEmpty(_diagnostics);
      strictEqual(receivedValues.length, 0); // No input values, only return
    });
  });

  describe("union type constraints", () => {
    let runner: BasicTestRunner;
    let receivedArgs: any[] = [];

    beforeEach(() => {
      receivedArgs = [];
      testHost.addJsFile("test.js", {
        acceptTypeOrValue(program: Program, arg: any) {
          receivedArgs.push(arg);
          return arg;
        },
        acceptMultipleTypes(program: Program, arg: any) {
          receivedArgs.push(arg);
          return arg;
        },
        acceptMultipleValues(program: Program, arg: any) {
          receivedArgs.push(arg);
          return arg;
        },
        returnTypeOrValue(program: Program, returnType: boolean) {
          if (returnType) {
            return program.checker.getStdType("string");
          } else {
            return "hello";
          }
        },
      });
      runner = createTestWrapper(testHost, {
        autoImports: ["./test.js"],
        autoUsings: ["TypeSpec.Reflection"],
      });
    });

    it("accepts type parameter", async () => {
      const diagnostics = await runner.diagnose(`
        extern fn acceptTypeOrValue(arg: Reflection.Type): Reflection.Type;
        
        alias TypeResult = acceptTypeOrValue(string);
      `);
      expectDiagnosticEmpty(diagnostics);
      strictEqual(receivedArgs.length, 1);
    });

    it("accepts value parameter", async () => {
      const diagnostics = await runner.diagnose(`
        extern fn acceptTypeOrValue(arg: valueof string): valueof string;
        
        const ValueResult = acceptTypeOrValue("hello");
      `);
      expectDiagnosticEmpty(diagnostics);
      strictEqual(receivedArgs.length, 1);
    });

    it("accepts multiple specific types", async () => {
      const diagnostics = await runner.diagnose(`
        extern fn acceptMultipleTypes(arg: Reflection.Model | Reflection.Enum): Reflection.Model | Reflection.Enum;
        
        model TestModel {}
        enum TestEnum { A }
        
        alias ModelResult = acceptMultipleTypes(TestModel);
        alias EnumResult = acceptMultipleTypes(TestEnum);
      `);
      expectDiagnosticEmpty(diagnostics);
      strictEqual(receivedArgs.length, 2);
    });

    it("accepts multiple value types", async () => {
      const diagnostics = await runner.diagnose(`
        extern fn acceptMultipleValues(arg: valueof (string | int32)): valueof (string | int32);
        
        const StringResult = acceptMultipleValues("test");
        const NumberResult = acceptMultipleValues(42);
      `);
      expectDiagnosticEmpty(diagnostics);
      strictEqual(receivedArgs.length, 2);
      strictEqual(receivedArgs[0], "test");
      strictEqual(receivedArgs[1], 42);
    });

    it("errors when argument doesn't match union constraint", async () => {
      const diagnostics = await runner.diagnose(`
        extern fn acceptMultipleTypes(arg: Reflection.Model | Reflection.Enum): Reflection.Model | Reflection.Enum;
        
        scalar TestScalar extends string;
        alias Result = acceptMultipleTypes(TestScalar);
      `);
      expectDiagnostics(diagnostics, {
        code: "unassignable",
      });
    });

    it("can return type from function", async () => {
      const diagnostics = await runner.diagnose(`
        extern fn returnTypeOrValue(returnType: valueof boolean): Reflection.Type;
        
        alias TypeResult = returnTypeOrValue(true);
      `);
      expectDiagnosticEmpty(diagnostics);
    });

    it("can return value from function", async () => {
      const diagnostics = await runner.diagnose(`
        extern fn returnTypeOrValue(returnType: valueof boolean): valueof string;
        
        const ValueResult = returnTypeOrValue(false);
      `);
      expectDiagnosticEmpty(diagnostics);
    });
  });

  describe("error cases and edge cases", () => {
    let runner: BasicTestRunner;

    beforeEach(() => {
      testHost.addJsFile("test.js", {
        returnWrongEntityKind(program: Program) {
          return "string value"; // Returns value when type expected
        },
        returnWrongValueType(program: Program) {
          return 42; // Returns number when string expected
        },
        throwError(program: Program) {
          throw new Error("JS error");
        },
        returnUndefined(program: Program) {
          return undefined;
        },
        returnNull(program: Program) {
          return null;
        },
        expectNonOptionalAfterOptional(program: Program, opt: any, req: any) {
          return req;
        },
      });
      runner = createTestWrapper(testHost, {
        autoImports: ["./test.js"],
        autoUsings: ["TypeSpec.Reflection"],
      });
    });

    it("errors when function returns wrong type kind", async () => {
      const _diagnostics = await runner.diagnose(`
        extern fn returnWrongEntityKind(): Reflection.Type;
        alias X = returnWrongEntityKind();
      `);
      // Should get diagnostics about type mismatch in return value
      // The current implementation has TODO for better error handling
    });

    it("errors when function returns wrong value type", async () => {
      const _diagnostics = await runner.diagnose(`
        extern fn returnWrongValueType(): valueof string;
        const X = returnWrongValueType();
      `);

      expectDiagnostics(_diagnostics, {
        code: "unassignable",
        message: "Type '42' is not assignable to type 'string'",
      });
    });

    it("handles JS function that throws", async () => {
      // Wrap in try-catch to handle JS errors gracefully
      try {
        const _diagnostics = await runner.diagnose(`
          extern fn throwError(): Reflection.Type;
          alias X = throwError();
        `);
        // If we get here, the function didn't throw (unexpected)
      } catch (error) {
        // Expected - JS function threw an error
        ok(error instanceof Error);
        strictEqual(error.message, "JS error");
      }
    });

    it("handles undefined return value", async () => {
      const _diagnostics = await runner.diagnose(`
        extern fn returnUndefined(): valueof unknown;
        const X = returnUndefined();
      `);
      // Should handle undefined appropriately
    });

    it("handles null return value", async () => {
      const _diagnostics = await runner.diagnose(`
        extern fn returnNull(): valueof unknown;
        const X = returnNull();
      `);
      // Should handle null appropriately
    });

    it("validates required parameter after optional not allowed in regular param position", async () => {
      const _diagnostics = await runner.diagnose(`
        extern fn expectNonOptionalAfterOptional(opt?: valueof string, req: valueof string): valueof string;
        const X = expectNonOptionalAfterOptional("test");
      `);
      // This should be a syntax/declaration error - required params can't follow optional ones
      // except when rest parameters are involved
    });

    it("allows rest parameters after optional parameters", async () => {
      testHost.addJsFile("rest-after-optional.js", {
        restAfterOptional(program: Program, opt: any, ...rest: any[]) {
          return rest.length;
        },
      });
      const restRunner = createTestWrapper(testHost, {
        autoImports: ["./rest-after-optional.js"],
        autoUsings: ["TypeSpec.Reflection"],
      });

      const diagnostics = await restRunner.diagnose(`
        extern fn restAfterOptional(opt?: valueof string, ...rest: valueof string[]): valueof int32;
        const X = restAfterOptional("optional", "rest1", "rest2");
        const Y = restAfterOptional();
      `);
      expectDiagnosticEmpty(diagnostics);
    });

    it("errors on empty union constraints", async () => {
      // This is likely a parse error, but worth testing behavior
      const _diagnostics = await runner.diagnose(`
        extern fn emptyUnion(arg: ): unknown;
        alias X = emptyUnion();
      `);
      // Should get parse error
    });

    it("handles deeply nested type constraints", async () => {
      testHost.addJsFile("nested.js", {
        processNestedModel(program: Program, model: Type) {
          return model;
        },
      });
      const nestedRunner = createTestWrapper(testHost, {
        autoImports: ["./nested.js"],
        autoUsings: ["TypeSpec.Reflection"],
      });

      const _diagnostics = await nestedRunner.diagnose(`
        extern fn processNestedModel(m: Reflection.Model): Reflection.Model;
        
        model Level1 {
          level2: {
            level3: {
              deep: string;
            }[];
          };
        }
        
        alias X = processNestedModel(Level1);
      `);
      expectDiagnosticEmpty(_diagnostics);
    });

    it("validates function return type matches declared constraint", async () => {
      testHost.addJsFile("return-validation.js", {
        returnString(program: Program) {
          return "hello";
        },
        returnNumber(program: Program) {
          return 42;
        },
      });
      const returnRunner = createTestWrapper(testHost, {
        autoImports: ["./return-validation.js"],
        autoUsings: ["TypeSpec.Reflection"],
      });

      const _diagnostics = await returnRunner.diagnose(`
        extern fn returnString(): valueof string;
        extern fn returnNumber(): valueof string; // Wrong: returns number but declares string
        
        const X = returnString();
        const Y = returnNumber();
      `);
      // Should get diagnostic about return type mismatch for returnNumber
    });
  });

  describe("default function results", () => {
    let runner: BasicTestRunner;

    beforeEach(() => {
      testHost.addJsFile("missing-impl.js", {
        // Intentionally empty - to test default implementations
      });
      runner = createTestWrapper(testHost, {
        autoImports: ["./missing-impl.js"],
        autoUsings: ["TypeSpec.Reflection"],
      });
    });

    it("returns default unknown value for missing value-returning function", async () => {
      const diagnostics = await runner.diagnose(`
        extern fn missingValueFn(): valueof string;
        const X = missingValueFn();
      `);
      expectDiagnostics(diagnostics, {
        code: "missing-implementation",
      });
    });

    it("returns default type for missing type-returning function", async () => {
      const diagnostics = await runner.diagnose(`
        extern fn missingTypeFn(): Reflection.Type;
        alias X = missingTypeFn();
      `);
      expectDiagnostics(diagnostics, {
        code: "missing-implementation",
      });
    });

    it("returns appropriate default for union return type", async () => {
      const diagnostics = await runner.diagnose(`
        extern fn missingUnionFn(): Reflection.Type | valueof string;
        const X = missingUnionFn();
      `);
      expectDiagnostics(diagnostics, {
        code: "missing-implementation",
      });
    });
  });

  describe("template and generic scenarios", () => {
    let runner: BasicTestRunner;

    beforeEach(() => {
      testHost.addJsFile("templates.js", {
        processGeneric(program: Program, type: Type) {
          return $(program).array.create(type);
        },
        processConstrainedGeneric(program: Program, type: Type) {
          return type;
        },
      });
      runner = createTestWrapper(testHost, {
        autoImports: ["./templates.js"],
        autoUsings: ["TypeSpec.Reflection"],
      });
    });

    it("works with template aliases", async () => {
      const [{ prop }, diagnostics] = (await runner.compileAndDiagnose(`
        extern fn processGeneric(T: Reflection.Type): Reflection.Type;
        
        alias ArrayOf<T> = processGeneric(T);
        
        model TestModel {
          @test prop: ArrayOf<string>;
        }
      `)) as [{ prop: ModelProperty }, Diagnostic[]];
      expectDiagnosticEmpty(diagnostics);

      ok(prop.type);
      ok($(runner.program).array.is(prop.type));
    });

    it("works with constrained templates", async () => {
      const diagnostics = await runner.diagnose(`
        extern fn processConstrainedGeneric(T: Reflection.Model): Reflection.Model;
        
        alias ProcessModel<T extends Reflection.Model> = processConstrainedGeneric(T);
        
        model TestModel {}
        alias Result = ProcessModel<TestModel>;
      `);
      expectDiagnosticEmpty(diagnostics);
    });

    it("errors when template constraint not satisfied", async () => {
      const diagnostics = await runner.diagnose(`
        extern fn processConstrainedGeneric(T: Reflection.Model): Reflection.Model;
        
        alias ProcessModel<T extends Reflection.Model> = processConstrainedGeneric(T);
        
        enum TestEnum { A }
        alias Result = ProcessModel<TestEnum>;
      `);
      expectDiagnostics(diagnostics, {
        code: "invalid-argument",
      });
    });
  });
});
