import { deepStrictEqual, fail, ok, strictEqual } from "assert";
import { beforeEach, describe, it } from "vitest";
import {
  Diagnostic,
  FunctionContext,
  IndeterminateEntity,
  Model,
  ModelProperty,
  Namespace,
  Type,
} from "../../src/core/types.js";
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
    let testImpl: any;
    let nsFnImpl: any;
    beforeEach(() => {
      testImpl = (_ctx: FunctionContext) => undefined;
      nsFnImpl = (_ctx: FunctionContext) => undefined;
      testHost.addJsFile("test.js", {
        $functions: {
          "": {
            testFn: testImpl,
          },
          "Foo.Bar": {
            nsFn: nsFnImpl,
          },
        },
      });
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

      it("in namespace via $functions map", async () => {
        await runner.compile(`namespace Foo.Bar { extern fn nsFn(); }`);
        const ns = runner.program
          .getGlobalNamespaceType()
          .namespaces.get("Foo")
          ?.namespaces.get("Bar");
        ok(ns);
        expectFunction(ns, "nsFn", nsFnImpl);
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
        $functions: {
          "": {
            testFn(ctx: FunctionContext, a: any, b: any, ...rest: any[]) {
              calledArgs = [ctx, a, b, ...rest];
              return a; // Return first arg
            },
            sum(_ctx: FunctionContext, ...addends: number[]) {
              return addends.reduce((a, b) => a + b, 0);
            },
            valFirst(_ctx: FunctionContext, v: any) {
              return v;
            },
            voidFn(ctx: FunctionContext, arg: any) {
              calledArgs = [ctx, arg];
              // No return value
            },
          },
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
      await runner.compile(`
        extern fn testFn(a: valueof string, b: valueof string, ...rest: valueof string[]): valueof string;
        
        const X = testFn("one", "two", "three");
      `);

      expectCalledWith("one", "two", "three"); // program + args, optional b provided
    });

    it("allows omitting optional param", async () => {
      await runner.compile(
        `extern fn testFn(a: valueof string, b?: valueof string): valueof string; const X = testFn("one");`,
      );

      expectCalledWith("one", undefined);
    });

    it("allows zero args for rest-only", async () => {
      const [{ p }, diagnostics] = (await runner.compileAndDiagnose(`
        extern fn sum(...addends: valueof int32[]): valueof int32;
        const S = sum();

        model Observer {
          @test
          p: int32 = S;
        }
      `)) as [{ p: ModelProperty }, Diagnostic[]];

      expectDiagnostics(diagnostics, []);

      strictEqual(p.defaultValue?.entityKind, "Value");
      strictEqual(p.defaultValue.valueKind, "NumericValue");
      strictEqual(p.defaultValue.value.asNumber(), 0);
    });

    it("accepts function with explicit void return type", async () => {
      const diagnostics = await runner.diagnose(`
        extern fn voidFn(a: valueof string): void;
        alias V = voidFn("test");
      `);

      expectDiagnostics(diagnostics, []);
      expectCalledWith("test");
    });

    it("errors if non-void function returns undefined", async () => {
      const diagnostics = await runner.diagnose(`
        extern fn voidFn(a: valueof string): unknown;
        alias V = voidFn("test");
      `);

      expectDiagnostics(diagnostics, {
        code: "function-return",
        message:
          "Implementation of 'fn voidFn' returned value 'null', which is not assignable to the declared return type 'unknown'.",
      });
      expectCalledWith("test");
    });

    it("errors if not enough args", async () => {
      const [{ p }, diagnostics] = (await runner.compileAndDiagnose(`
        extern fn testFn(a: valueof string, b: valueof string): valueof string;
        const X = testFn("one");

        model Observer {
          @test p: string = X;
        }
      `)) as [{ p: ModelProperty }, Diagnostic[]];

      expectDiagnostics(diagnostics, {
        code: "invalid-argument-count",
        message: "Expected at least 2 arguments, but got 1.",
      });

      strictEqual(p.defaultValue?.entityKind, "Value");
      strictEqual(p.defaultValue.valueKind, "UnknownValue");
    });

    it("errors if too many args", async () => {
      const [{ p }, diagnostics] = (await runner.compileAndDiagnose(`
        extern fn testFn(a: valueof string): valueof string;
        const X = testFn("one", "two");

        model Observer {
          @test p: string = X;
        }
      `)) as [{ p: ModelProperty }, Diagnostic[]];

      expectDiagnostics(diagnostics, {
        code: "invalid-argument-count",
        message: "Expected 1 arguments, but got 2.",
      });

      expectCalledWith("one", undefined);

      strictEqual(p.defaultValue?.entityKind, "Value");
      strictEqual(p.defaultValue.valueKind, "StringValue");
      strictEqual(p.defaultValue.value, "one");
    });

    it("errors if too few with rest", async () => {
      const [{ p }, diagnostics] = (await runner.compileAndDiagnose(`
        extern fn testFn(a: string, ...rest: string[]);

        alias X = testFn();

        model Observer {
          @test p: X;
        }
      `)) as [{ p: ModelProperty }, Diagnostic[]];

      expectDiagnostics(diagnostics, {
        code: "invalid-argument-count",
        message: "Expected at least 1 arguments, but got 0.",
      });

      strictEqual(p.type.kind, "Intrinsic");
      strictEqual(p.type.name, "ErrorType");
    });

    it("errors if argument type mismatch (value)", async () => {
      const diagnostics = await runner.diagnose(`
        extern fn valFirst(a: valueof string): valueof string;
        const X = valFirst(123);
      `);

      expectDiagnostics(diagnostics, {
        code: "unassignable",
        message: "Type '123' is not assignable to type 'string'",
      });
    });

    it("errors if passing type where value expected", async () => {
      const diagnostics = await runner.diagnose(`
        extern fn valFirst(a: valueof string): valueof string;
        const X = valFirst(string);
      `);

      expectDiagnostics(diagnostics, {
        code: "expect-value",
        message: "string refers to a type, but is being used as a value here.",
      });
    });

    it("accepts string literal for type param", async () => {
      const diagnostics = await runner.diagnose(`
        extern fn testFn(a: string);
        alias X = testFn("abc");
      `);

      expectDiagnosticEmpty(diagnostics);

      strictEqual(calledArgs?.[1].entityKind, "Type");
      strictEqual(calledArgs?.[1].kind, "String");
      strictEqual(calledArgs?.[1].value, "abc");
    });

    it("accepts arguments matching rest", async () => {
      const diagnostics = await runner.diagnose(`
        extern fn testFn(a: string, ...rest: string[]);
        alias X = testFn("a", "b", "c");
      `);

      expectDiagnosticEmpty(diagnostics);

      const expectedLiterals = ["a", "b", "c"];

      for (let i = 1; i < calledArgs!.length; i++) {
        strictEqual(calledArgs?.[i].entityKind, "Type");
        strictEqual(calledArgs?.[i].kind, "String");
        strictEqual(calledArgs?.[i].value, expectedLiterals[i - 1]);
      }
    });

    it("calls function bound to const", async () => {
      const [{ p }, diagnostics] = (await runner.compileAndDiagnose(`
        extern fn sum(...addends: valueof int32[]): valueof int32;

        const f = sum;

        model Observer {
          @test p: int32 = f(1, 2, 3);
        }
      `)) as [{ p: ModelProperty }, Diagnostic[]];

      expectDiagnosticEmpty(diagnostics);

      strictEqual(p.defaultValue?.entityKind, "Value");
      strictEqual(p.defaultValue.valueKind, "NumericValue");
      strictEqual(p.defaultValue.value.asNumber(), 6);
    });
  });

  describe("typekit construction", () => {
    it("can construct array with typekit in impl", async () => {
      testHost.addJsFile("test.js", {
        $functions: {
          "": {
            makeArray(ctx: FunctionContext, t: Type) {
              return $(ctx.program).array.create(t);
            },
          },
        },
      });
      const runner = createTestWrapper(testHost, {
        autoImports: ["./test.js"],
        autoUsings: ["TypeSpec.Reflection"],
      });
      const [{ p }, diagnostics] = (await runner.compileAndDiagnose(`
        extern fn makeArray(T: unknown);
        
        alias X = makeArray(string);

        model M {
          @test p: X;
        }
      `)) as [{ p: ModelProperty }, Diagnostic[]];

      expectDiagnosticEmpty(diagnostics);

      ok(p.type);
      ok($(runner.program).array.is(p.type));

      const arrayIndexerType = p.type.indexer.value;

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
        $functions: {
          "": {
            expectModel(_ctx: FunctionContext, model: Type) {
              receivedTypes.push(model);
              return model;
            },
            expectEnum(_ctx: FunctionContext, enumType: Type) {
              receivedTypes.push(enumType);
              return enumType;
            },
            expectScalar(_ctx: FunctionContext, scalar: Type) {
              receivedTypes.push(scalar);
              return scalar;
            },
            expectUnion(_ctx: FunctionContext, union: Type) {
              receivedTypes.push(union);
              return union;
            },
            expectInterface(_ctx: FunctionContext, iface: Type) {
              receivedTypes.push(iface);
              return iface;
            },
            expectNamespace(_ctx: FunctionContext, ns: Type) {
              receivedTypes.push(ns);
              return ns;
            },
            expectOperation(_ctx: FunctionContext, op: Type) {
              receivedTypes.push(op);
              return op;
            },
          },
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
      strictEqual(receivedTypes[0].name, "TestModel");
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
      strictEqual(receivedTypes[0].name, "TestEnum");
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
      strictEqual(receivedTypes[0].name, "TestScalar");
    });

    it("accepts Reflection.Union parameter", async () => {
      const diagnostics = await runner.diagnose(`
        extern fn expectUnion(u: Reflection.Union): Reflection.Union;
        alias X = expectUnion(string | int32);
      `);

      expectDiagnosticEmpty(diagnostics);
      strictEqual(receivedTypes.length, 1);
      strictEqual(receivedTypes[0].kind, "Union");
      strictEqual(receivedTypes[0].name, undefined);
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
      strictEqual(receivedTypes[0].name, "TestInterface");
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
      strictEqual(receivedTypes[0].name, "TestNs");
    });

    it("accepts Reflection.Operation parameter", async () => {
      const diagnostics = await runner.diagnose(`
        extern fn expectOperation(operation: Reflection.Operation): Reflection.Operation;
        op testOp(): string;
        alias X = expectOperation(testOp);
      `);

      expectDiagnosticEmpty(diagnostics);
      strictEqual(receivedTypes.length, 1);
      strictEqual(receivedTypes[0].kind, "Operation");
      strictEqual(receivedTypes[0].name, "testOp");
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
        $functions: {
          "": {
            expectString(ctx: FunctionContext, str: string) {
              receivedValues.push(str);
              return str;
            },
            expectNumber(ctx: FunctionContext, num: number) {
              receivedValues.push(num);
              return num;
            },
            expectBoolean(ctx: FunctionContext, bool: boolean) {
              receivedValues.push(bool);
              return bool;
            },
            expectArray(ctx: FunctionContext, arr: any[]) {
              receivedValues.push(arr);
              return arr;
            },
            expectObject(ctx: FunctionContext, obj: Record<string, any>) {
              receivedValues.push(obj);
              return obj;
            },
            returnInvalidJsValue(ctx: FunctionContext) {
              return Symbol("invalid");
            },
            returnComplexObject(ctx: FunctionContext) {
              return {
                nested: { value: 42 },
                array: [1, "test", true],
                null: null,
              };
            },
            returnIndeterminate(ctx: FunctionContext): IndeterminateEntity {
              return { entityKind: "Indeterminate", type: $(ctx.program).literal.create(42) };
            },
          },
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
      const diagnostics = await runner.diagnose(`
        extern fn returnInvalidJsValue(): valueof string;
        const X = returnInvalidJsValue();
      `);

      expectDiagnostics(diagnostics, {
        code: "function-return",
        message: "Function implementation returned invalid JS value 'Symbol(invalid)'.",
      });
    });

    it("unmarshal complex JS objects to values", async () => {
      const [{ p }, diagnostics] = (await runner.compileAndDiagnose(`
        extern fn returnComplexObject(): valueof unknown;
        const X = returnComplexObject();

        model Observer {
          @test p: unknown = X;
        }
      `)) as [{ p: ModelProperty }, Diagnostic[]];

      expectDiagnosticEmpty(diagnostics);
      strictEqual(receivedValues.length, 0);

      strictEqual(p.defaultValue?.entityKind, "Value");
      strictEqual(p.defaultValue?.valueKind, "ObjectValue");

      const obj = p.defaultValue!.properties;
      strictEqual(obj.size, 3);

      const nested = obj.get("nested")?.value;
      ok(nested);
      strictEqual(nested.entityKind, "Value");
      strictEqual(nested.valueKind, "ObjectValue");

      const nestedProps = nested.properties;
      strictEqual(nestedProps.size, 1);
      const nestedValue = nestedProps.get("value")?.value;
      ok(nestedValue);
      strictEqual(nestedValue.entityKind, "Value");
      strictEqual(nestedValue.valueKind, "NumericValue");
      strictEqual(nestedValue.value.asNumber(), 42);

      const array = obj.get("array")?.value;
      ok(array);
      strictEqual(array.entityKind, "Value");
      strictEqual(array.valueKind, "ArrayValue");

      const arrayItems = array.values;
      strictEqual(arrayItems.length, 3);

      strictEqual(arrayItems[0].entityKind, "Value");
      strictEqual(arrayItems[0].valueKind, "NumericValue");
      strictEqual(arrayItems[0].value.asNumber(), 1);

      strictEqual(arrayItems[1].entityKind, "Value");
      strictEqual(arrayItems[1].valueKind, "StringValue");
      strictEqual(arrayItems[1].value, "test");

      strictEqual(arrayItems[2].entityKind, "Value");
      strictEqual(arrayItems[2].valueKind, "BooleanValue");
      strictEqual(arrayItems[2].value, true);

      const nullP = obj.get("null")?.value;
      ok(nullP);
      strictEqual(nullP.entityKind, "Value");
      strictEqual(nullP.valueKind, "NullValue");
    });

    it("handles indeterminate entities coerced to values", async () => {
      const [{ p }, diagnostics] = (await runner.compileAndDiagnose(`
        extern fn returnIndeterminate(): valueof int32;
        extern fn expectNumber(n: valueof int32): valueof int32;
        const X = expectNumber(returnIndeterminate());

        model Observer {
          @test p: int32 = X;
        }
      `)) as [{ p: ModelProperty }, Diagnostic[]];

      expectDiagnosticEmpty(diagnostics);

      strictEqual(p.defaultValue?.entityKind, "Value");
      strictEqual(p.defaultValue?.valueKind, "NumericValue");
      strictEqual(p.defaultValue?.value.asNumber(), 42);
    });

    it("handles indeterminate entities coerced to types", async () => {
      const [{ p }, diagnostics] = (await runner.compileAndDiagnose(`
        extern fn returnIndeterminate(): int32;

        alias X = returnIndeterminate();

        model Observer {
          @test p: X;
        }
      `)) as [{ p: ModelProperty }, Diagnostic[]];

      expectDiagnosticEmpty(diagnostics);

      strictEqual(p.type.kind, "Number");
      strictEqual(p.type.value, 42);
    });
  });

  describe("union type constraints", () => {
    let runner: BasicTestRunner;
    let receivedArgs: any[] = [];

    beforeEach(() => {
      receivedArgs = [];
      testHost.addJsFile("test.js", {
        $functions: {
          "": {
            acceptTypeOrValue(_ctx: FunctionContext, arg: any) {
              receivedArgs.push(arg);
              return arg;
            },
            acceptMultipleTypes(_ctx: FunctionContext, arg: any) {
              receivedArgs.push(arg);
              return arg;
            },
            acceptMultipleValues(_ctx: FunctionContext, arg: any) {
              receivedArgs.push(arg);
              return arg;
            },
            returnTypeOrValue(ctx: FunctionContext, returnType: boolean) {
              receivedArgs.push(returnType);
              if (returnType) {
                return ctx.program.checker.getStdType("string");
              } else {
                return "hello";
              }
            },
          },
        },
      });
      runner = createTestWrapper(testHost, {
        autoImports: ["./test.js"],
        autoUsings: ["TypeSpec.Reflection"],
      });
    });

    it("accepts type parameter", async () => {
      const diagnostics = await runner.diagnose(`
        extern fn acceptTypeOrValue(arg: unknown | valueof unknown): unknown;
        
        alias TypeResult = acceptTypeOrValue(string);
      `);

      expectDiagnosticEmpty(diagnostics);

      strictEqual(receivedArgs.length, 1);
    });

    it("prefers value when applicable", async () => {
      const diagnostics = await runner.diagnose(`
        extern fn acceptTypeOrValue(arg: string | valueof string): valueof string;
        
        const ValueResult = acceptTypeOrValue("hello");
      `);

      expectDiagnosticEmpty(diagnostics);

      strictEqual(receivedArgs.length, 1);
      // Prefer value overload
      strictEqual(receivedArgs[0], "hello");
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
      strictEqual(receivedArgs[0].kind, "Model");
      strictEqual(receivedArgs[0].name, "TestModel");
      strictEqual(receivedArgs[1].kind, "Enum");
      strictEqual(receivedArgs[1].name, "TestEnum");
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
        message: "Type 'TestScalar' is not assignable to type 'Model | Enum'",
      });
    });

    it("can return type from function", async () => {
      const [{ p }, diagnostics] = (await runner.compileAndDiagnose(`
        extern fn returnTypeOrValue(returnType: valueof boolean): unknown;
        
        alias TypeResult = returnTypeOrValue(true);

        model Observer {
          @test p: TypeResult;
        }
      `)) as [{ p: ModelProperty }, Diagnostic[]];

      expectDiagnosticEmpty(diagnostics);

      deepStrictEqual(receivedArgs, [true]);

      strictEqual(p.type.kind, "Scalar");
      strictEqual(p.type.name, "string");
    });

    it("can return value from function", async () => {
      const [{ p }, diagnostics] = (await runner.compileAndDiagnose(`
        extern fn returnTypeOrValue(returnType: valueof boolean): valueof string;
        
        const ValueResult = returnTypeOrValue(false);

        model Observer {
          @test p: string = ValueResult;
        }
      `)) as [{ p: ModelProperty }, Diagnostic[]];

      expectDiagnosticEmpty(diagnostics);

      deepStrictEqual(receivedArgs, [false]);

      strictEqual(p.defaultValue?.entityKind, "Value");
      strictEqual(p.defaultValue?.valueKind, "StringValue");
      strictEqual(p.defaultValue?.value, "hello");
    });
  });

  describe("error cases and edge cases", () => {
    let runner: BasicTestRunner;

    beforeEach(() => {
      testHost.addJsFile("test.js", {
        $functions: {
          "": {
            testFn() {},
            returnWrongEntityKind(_ctx: FunctionContext) {
              return "string value"; // Returns value when type expected
            },
            returnWrongValueType(_ctx: FunctionContext) {
              return 42; // Returns number when string expected
            },
            throwError(_ctx: FunctionContext) {
              throw new Error("JS error");
            },
            returnUndefined(_ctx: FunctionContext) {
              return undefined;
            },
            returnNull(_ctx: FunctionContext) {
              return null;
            },
            expectNonOptionalAfterOptional(_ctx: FunctionContext, _opt: any, req: any) {
              return req;
            },
          },
        },
      });
      runner = createTestWrapper(testHost, {
        autoImports: ["./test.js"],
        autoUsings: ["TypeSpec.Reflection"],
      });
    });

    it("errors when function returns wrong entity kind", async () => {
      const diagnostics = await runner.diagnose(`
        extern fn returnWrongEntityKind(): unknown;
        alias X = returnWrongEntityKind();
      `);

      expectDiagnostics(diagnostics, {
        code: "function-return",
        message:
          "Implementation of 'fn returnWrongEntityKind' returned value '\"string value\"', which is not assignable to the declared return type 'unknown'.",
      });
    });

    it("errors when function returns wrong value type", async () => {
      const diagnostics = await runner.diagnose(`
        extern fn returnWrongValueType(): valueof string;
        const X = returnWrongValueType();
      `);

      expectDiagnostics(diagnostics, {
        code: "function-return",
        message:
          "Implementation of 'fn returnWrongValueType' returned value '42', which is not assignable to the declared return type 'valueof string'.",
      });
    });

    it("thrown JS error bubbles up as ICE", async () => {
      try {
        const _diagnostics = await runner.diagnose(`
          extern fn throwError(): unknown;
          alias X = throwError();
        `);

        fail("Expected error to be thrown");
      } catch (error) {
        ok(error instanceof Error);
        strictEqual(error.message, "JS error");
      }
    });

    it("returns null for undefined return in value position", async () => {
      const [{ p }, diagnostics] = (await runner.compileAndDiagnose(`
        extern fn returnUndefined(): valueof unknown;
        const X = returnUndefined();

        model Observer {
          @test p: unknown = X;
        }
      `)) as [{ p: ModelProperty }, Diagnostic[]];

      expectDiagnosticEmpty(diagnostics);

      strictEqual(p.defaultValue?.entityKind, "Value");
      strictEqual(p.defaultValue?.valueKind, "NullValue");
    });

    it("handles null return value", async () => {
      const [{ p }, diagnostics] = (await runner.compileAndDiagnose(`
        extern fn returnNull(): valueof unknown;
        const X = returnNull();

        model Observer {
          @test p: unknown = X;
        }
      `)) as [{ p: ModelProperty }, Diagnostic[]];

      expectDiagnosticEmpty(diagnostics);

      strictEqual(p.defaultValue?.entityKind, "Value");
      strictEqual(p.defaultValue?.valueKind, "NullValue");
    });

    it("validates required parameter after optional not allowed in regular param position", async () => {
      const diagnostics = await runner.diagnose(`
        extern fn expectNonOptionalAfterOptional(opt?: valueof string, req: valueof string): valueof string;
        const X = expectNonOptionalAfterOptional("test");
      `);

      expectDiagnostics(diagnostics, {
        code: "required-parameter-first",
        message: "A required parameter cannot follow an optional parameter.",
      });
    });

    it("cannot be used as a regular type", async () => {
      const diagnostics = await runner.diagnose(`
        extern fn testFn(): unknown;
        
        model M {
          prop: testFn;
        }
      `);

      expectDiagnostics(diagnostics, {
        code: "value-in-type",
        message: "A value cannot be used as a type.",
      });
    });
  });

  describe("default function results", () => {
    let runner: BasicTestRunner;

    beforeEach(() => {
      testHost.addJsFile("missing-impl.js", {});
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
        extern fn missingTypeFn(): unknown;
        alias X = missingTypeFn();
      `);
      expectDiagnostics(diagnostics, {
        code: "missing-implementation",
      });
    });

    it("returns appropriate default for union return type", async () => {
      const diagnostics = await runner.diagnose(`
        extern fn missingUnionFn(): unknown | valueof string;
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
        $functions: {
          "": {
            processGeneric(ctx: FunctionContext, type: Type) {
              return $(ctx.program).array.create(type);
            },
            processConstrainedGeneric(_ctx: FunctionContext, type: Type) {
              return type;
            },
          },
        },
      });
      runner = createTestWrapper(testHost, {
        autoImports: ["./templates.js"],
        autoUsings: ["TypeSpec.Reflection"],
      });
    });

    it("works with template aliases", async () => {
      const [{ prop }, diagnostics] = (await runner.compileAndDiagnose(`
        extern fn processGeneric(T: unknown): unknown;
        
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

    it("template instantiations of function calls yield identical instances", async () => {
      const [{ A, B }, diagnostics] = (await runner.compileAndDiagnose(`
        extern fn processGeneric(T: unknown): unknown;
        
        alias ArrayOf<T> = processGeneric(T);
        
        @test
        model A {
          propA: ArrayOf<string>;
        }
        
        @test
        model B {
          propB: ArrayOf<string>;
        }
      `)) as [{ A: Model; B: Model }, Diagnostic[]];

      expectDiagnosticEmpty(diagnostics);

      const aProp = A.properties.get("propA");
      const bProp = B.properties.get("propB");

      ok(aProp);
      ok(bProp);

      ok($(runner.program).array.is(aProp.type));
      ok($(runner.program).array.is(bProp.type));

      strictEqual(aProp.type, bProp.type);
    });
  });
});
