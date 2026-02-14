import { deepStrictEqual, fail, ok, strictEqual } from "assert";
import { beforeEach, describe, expect, it } from "vitest";
import {
  Diagnostic,
  FunctionContext,
  IndeterminateEntity,
  Model,
  Namespace,
  Type,
  Value,
} from "../../src/core/types.js";
import {
  DiagnosticMatch,
  type Tester,
  expectDiagnosticEmpty,
  expectDiagnostics,
  mockFile,
  t,
} from "../../src/testing/index.js";
import { $ } from "../../src/typekit/index.js";
import { Tester as BaseTester } from "../tester.js";

/** Helper to assert a function declaration was bound to the js implementation */
function expectFunction(ns: Namespace, name: string, impl: any) {
  const fn = ns.functionDeclarations.get(name);
  ok(fn, `Expected function ${name} to be declared.`);
  strictEqual(fn.implementation, impl);
}

function expectFunctionDiagnostics(
  diagnostics: readonly Diagnostic[],
  match: DiagnosticMatch | DiagnosticMatch[],
) {
  expect(diagnostics.some((d) => d.code === "experimental-feature")).toBeTruthy();
  const filtered = diagnostics.filter((d) => d.code !== "experimental-feature");
  expectDiagnostics(filtered, match);
}

function expectFunctionDiagnosticsEmpty(diagnostics: readonly Diagnostic[]) {
  expect(diagnostics.some((d) => d.code === "experimental-feature")).toBeTruthy();
  expectDiagnosticEmpty(diagnostics.filter((d) => d.code !== "experimental-feature"));
}

let tester: Tester = BaseTester;

describe("declaration", () => {
  let testImpl: any;
  let nsFnImpl: any;
  beforeEach(() => {
    testImpl = (_ctx: FunctionContext) => undefined;
    nsFnImpl = (_ctx: FunctionContext) => undefined;

    tester = BaseTester.files({
      "test.js": mockFile.js({
        $functions: {
          "": {
            testFn: testImpl,
          },
          "Foo.Bar": {
            nsFn: nsFnImpl,
          },
        },
      }),
    })
      .import("./test.js")
      .using("TypeSpec.Reflection");
  });

  describe("bind implementation to declaration", () => {
    it("defined at root via direct export", async () => {
      const [{ program }, diagnostics] = await tester.compileAndDiagnose(`
          extern fn testFn();
        `);

      expectFunctionDiagnosticsEmpty(diagnostics);

      expectFunction(program.getGlobalNamespaceType(), "testFn", testImpl);
    });

    it("in namespace via $functions map", async () => {
      const [{ program }, diagnostics] = await tester.compileAndDiagnose(`
        namespace Foo.Bar { extern fn nsFn(); }
      `);
      expectFunctionDiagnosticsEmpty(diagnostics);
      const ns = program.getGlobalNamespaceType().namespaces.get("Foo")?.namespaces.get("Bar");
      ok(ns);
      expectFunction(ns, "nsFn", nsFnImpl);
    });
  });

  it("errors if function is missing extern modifier", async () => {
    const diagnostics = await tester.diagnose(`fn testFn();`);
    expectFunctionDiagnostics(diagnostics, {
      code: "function-extern",
      message: "A function declaration must be prefixed with the 'extern' modifier.",
    });
  });

  it("errors if extern function is missing implementation", async () => {
    const diagnostics = await tester.diagnose(`extern fn missing();`);
    expectFunctionDiagnostics(diagnostics, {
      code: "missing-implementation",
      message: "Extern declaration must have an implementation in JS file.",
    });
  });

  it("errors if rest parameter type is not array", async () => {
    const diagnostics = await tester.diagnose(`extern fn f(...rest: string);`);
    expectFunctionDiagnostics(diagnostics, [
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
  let calledArgs: any[] | undefined;
  beforeEach(() => {
    calledArgs = undefined;

    tester = BaseTester.files({
      "test.js": mockFile.js({
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
      }),
    })
      .import("./test.js")
      .using("TypeSpec.Reflection");
  });

  function expectNotCalled() {
    ok(calledArgs === undefined, "Expected function not to be called.");
  }

  function expectCalledWith(...args: any[]) {
    ok(calledArgs, "Function was not called.");
    strictEqual(calledArgs.length, 1 + args.length);
    for (const [i, v] of args.entries()) {
      strictEqual(calledArgs[1 + i], v);
    }
  }

  async function expectFunctionTypeUsage(
    signature: string,
    call: string,
    match: DiagnosticMatch[] = [],
  ): Promise<Type> {
    const [{ p }, diagnostics] = await tester.compileAndDiagnose(t.code`
        ${signature};
        
        model Observer {
          ${t.modelProperty("p")}: ${call};
    }`);

    expectFunctionDiagnostics(diagnostics, match);

    return p.type;
  }

  async function expectFunctionValueUsage(
    signature: string,
    call: string,
    match: DiagnosticMatch[] = [],
  ): Promise<Value | undefined> {
    const [{ p }, diagnostics] = await tester.compileAndDiagnose(t.code`
        ${signature};

        model Observer {
          ${t.modelProperty("p")}: unknown = ${call};
        }
      `);

    expectFunctionDiagnostics(diagnostics, match);

    return p.defaultValue;
  }

  it("errors if function not declared", async () => {
    const diagnostics = await tester.diagnose(`const X = missing();`);

    expectDiagnostics(diagnostics, {
      code: "invalid-ref",
      message: "Unknown identifier missing",
    });
  });

  it("calls function with arguments", async () => {
    const v = await expectFunctionValueUsage(
      "extern fn testFn(a: valueof string, b: valueof string, ...rest: valueof string[]): valueof string",
      'testFn("one", "two", "three")',
    );

    expectCalledWith("one", "two", "three");
    strictEqual(v?.entityKind, "Value");
    strictEqual(v.valueKind, "StringValue");
    strictEqual(v.value, "one");
  });

  it("allows omitting optional param", async () => {
    const v = await expectFunctionValueUsage(
      "extern fn testFn(a: valueof string, b?: valueof string): valueof string",
      'testFn("one")',
    );

    expectCalledWith("one", undefined);

    strictEqual(v?.entityKind, "Value");
    strictEqual(v.valueKind, "StringValue");
    strictEqual(v.value, "one");
  });

  it("allows zero args for rest-only", async () => {
    const v = await expectFunctionValueUsage(
      "extern fn sum(...addends: valueof int32[]): valueof int32",
      "sum()",
    );

    strictEqual(v?.entityKind, "Value");
    strictEqual(v.valueKind, "NumericValue");
    strictEqual(v.value.asNumber(), 0);
  });

  it("accepts function with explicit void return type", async () => {
    const t = await expectFunctionTypeUsage(
      "extern fn voidFn(a: valueof string): void",
      'voidFn("test")',
    );
    expectCalledWith("test");

    strictEqual(t.kind, "Intrinsic");
    strictEqual(t.name, "void");
  });

  it("errors if non-void function returns undefined", async () => {
    const t = await expectFunctionTypeUsage(
      "extern fn voidFn(a: valueof string): unknown",
      'voidFn("test")',
      [
        {
          code: "function-return",
          message:
            "Implementation of 'fn voidFn' returned value 'null', which is not assignable to the declared return type 'unknown'.",
        },
      ],
    );
    expectCalledWith("test");
    // Function returned wrong type, so we expect it to transpose to ErrorType.
    strictEqual(t.kind, "Intrinsic");
    strictEqual(t.name, "ErrorType");
  });

  it("errors if not enough args", async () => {
    const v = await expectFunctionValueUsage(
      "extern fn testFn(a: valueof string, b: valueof string): valueof string",
      'testFn("one")',
      [
        {
          code: "invalid-argument-count",
          message: "Expected at least 2 arguments, but got 1.",
        },
      ],
    );

    expectNotCalled();

    // Because the const is invalid (transposed to null in the checker), we expect no default value.
    strictEqual(v, undefined);
  });

  it("errors if too many args", async () => {
    const v = await expectFunctionValueUsage(
      "extern fn testFn(a: valueof string): valueof string",
      'testFn("one", "two")',
      [
        {
          code: "invalid-argument-count",
          message: "Expected 1 arguments, but got 2.",
        },
      ],
    );

    expectCalledWith("one", undefined);

    strictEqual(v?.entityKind, "Value");
    strictEqual(v.valueKind, "StringValue");
    strictEqual(v.value, "one");
  });

  it("errors if too few with rest", async () => {
    const t = await expectFunctionTypeUsage(
      "extern fn testFn(a: string, ...rest: string[])",
      "testFn()",
      [
        {
          code: "invalid-argument-count",
          message: "Expected at least 1 arguments, but got 0.",
        },
      ],
    );

    expectNotCalled();

    // In this case, we did not call the function, so we expect the constraint.
    strictEqual(t.kind, "Intrinsic");
    strictEqual(t.name, "unknown");
  });

  it("errors if argument type mismatch (value)", async () => {
    const v = await expectFunctionValueUsage(
      "extern fn valFirst(a: valueof string): valueof string",
      "valFirst(123)",
      [
        {
          code: "unassignable",
          message: "Type '123' is not assignable to type 'string'",
        },
      ],
    );

    expectNotCalled();

    strictEqual(v, undefined);
  });

  it("errors if passing type where value expected", async () => {
    const v = await expectFunctionValueUsage(
      "extern fn valFirst(a: valueof string): valueof string",
      "valFirst(string)",
      [
        {
          code: "expect-value",
          message: "string refers to a type, but is being used as a value here.",
        },
      ],
    );

    strictEqual(v, undefined);
  });

  it("accepts string literal for type param", async () => {
    const t = await expectFunctionTypeUsage("extern fn testFn(a: string)", 'testFn("abc")');

    strictEqual(calledArgs?.[1].entityKind, "Type");
    strictEqual(calledArgs[1].kind, "String");
    strictEqual(calledArgs[1].value, "abc");

    strictEqual(t.kind, "String");
    strictEqual(t.value, "abc");
  });

  it("accepts arguments matching rest", async () => {
    const t = await expectFunctionTypeUsage(
      "extern fn testFn(a: string, ...rest: string[])",
      'testFn("a", "b", "c")',
    );

    const expectedLiterals = ["a", "b", "c"];

    for (let i = 1; i < calledArgs!.length; i++) {
      strictEqual(calledArgs?.[i].entityKind, "Type");
      strictEqual(calledArgs[i].kind, "String");
      strictEqual(calledArgs[i].value, expectedLiterals[i - 1]);
    }

    strictEqual(t.kind, "String");
    strictEqual(t.value, "a");
  });

  it("accepts valueof model argument", async () => {
    const [{ p }, diagnostics] = await tester.compileAndDiagnose(t.code`
        model M { x: string }
        extern fn testFn(m: valueof M): valueof M;

        model Observer {
          ${t.modelProperty("p")}: M = testFn(#{ x: "test" });
        }
      `);

    expectFunctionDiagnosticsEmpty(diagnostics);
    deepStrictEqual(calledArgs?.[1], { x: "test" });

    strictEqual(p.defaultValue?.entityKind, "Value");
    strictEqual(p.defaultValue.valueKind, "ObjectValue");
    const props = p.defaultValue.properties;
    strictEqual(props.size, 1);
    const x = props.get("x");
    ok(x);
    strictEqual(x.value.entityKind, "Value");
    strictEqual(x.value.valueKind, "StringValue");
    strictEqual(x.value.value, "test");
  });

  it("does not accept invalid valueof model argument", async () => {
    const diagnostics = await tester.diagnose(`
        model M { x: string }

        extern fn testFn(m: valueof M): valueof M;

        model Observer {
          p: M = testFn(#{ y: "test" });
        }
      `);

    expectFunctionDiagnostics(diagnostics, {
      code: "invalid-argument",
      message: "Argument of type '{ y: \"test\" }' is not assignable to parameter of type 'M'",
    });
  });

  it("accepts literal type where parameter is a union of literals", async () => {
    const t = await expectFunctionTypeUsage(
      'extern fn testFn(arg: "a" | 10 | true): "a" | 10 | true',
      'testFn("a")',
    );

    const arg = calledArgs?.[1] as Type;
    ok(arg);
    strictEqual(arg.entityKind, "Type");
    strictEqual(arg.kind, "String");
    strictEqual(arg.value, "a");

    strictEqual(t.kind, "String");
    strictEqual(t.value, "a");
  });

  it("accepts literal type where parameter is an array of union of literals", async () => {
    const t = await expectFunctionTypeUsage(
      'extern fn testFn(args: Array<"a" | 10 | true>): Array<"a" | 10 | true>',
      'testFn(["a", 10, true])',
    );

    const arg = calledArgs?.[1] as Type;

    ok(arg);

    strictEqual(arg.entityKind, "Type");
    strictEqual(arg.kind, "Tuple");
    const [a, b, c] = arg.values;

    strictEqual(a.entityKind, "Type");
    strictEqual(a.kind, "String");
    strictEqual(a.value, "a");

    strictEqual(b.entityKind, "Type");
    strictEqual(b.kind, "Number");
    strictEqual(b.value, 10);

    strictEqual(c.entityKind, "Type");
    strictEqual(c.kind, "Boolean");
    strictEqual(c.value, true);

    strictEqual(t.kind, "Tuple");
    strictEqual(t.values.length, 3);
    const [tA, tB, tC] = t.values;

    strictEqual(tA.kind, "String");
    strictEqual(tA.value, "a");
    strictEqual(tB.kind, "Number");
    strictEqual(tB.value, 10);
    strictEqual(tC.kind, "Boolean");
    strictEqual(tC.value, true);
  });

  it("accepts literal types where parameter is a rest array of a literal union", async () => {
    const diagnostics = await tester.diagnose(`
        alias U = "a" | 10 | true;
        extern fn testFn(...args: U[]): "a" | 10 | true;

        alias X = testFn("a", 10, true);
      `);

    expectFunctionDiagnosticsEmpty(diagnostics);

    const arg = calledArgs?.[1] as Type;
    ok(arg);
    strictEqual(arg.entityKind, "Type");
    strictEqual(arg.kind, "String");
    strictEqual(arg.value, "a");

    const arg2 = calledArgs?.[2] as Type;
    ok(arg2);
    strictEqual(arg2.entityKind, "Type");
    strictEqual(arg2.kind, "Number");
    strictEqual(arg2.value, 10);

    const arg3 = calledArgs?.[3] as Type;
    ok(arg3);
    strictEqual(arg3.entityKind, "Type");
    strictEqual(arg3.kind, "Boolean");
    strictEqual(arg3.value, true);
  });

  it("accepts enum member where parameter is enum", async () => {
    const diagnostics = await tester.diagnose(`
        enum E { A, B }

        extern fn testFn(e: E): E;

        alias X = testFn(E.A);
      `);
    expectFunctionDiagnosticsEmpty(diagnostics);
    const arg = calledArgs?.[1] as Type;
    ok(arg);
    strictEqual(arg.entityKind, "Type");
    strictEqual(arg.kind, "EnumMember");
    strictEqual(arg.name, "A");
  });

  it("accepts enum value where parameter is valueof enum", async () => {
    const [{ E, p }, diagnostics] = await tester.compileAndDiagnose(t.code`
        enum ${t.enum("E")} { A, B }
        extern fn testFn(e: valueof E): valueof E;

        model Observer {
          ${t.modelProperty("p")}: E = testFn(E.A);
        }
      `);

    expectFunctionDiagnosticsEmpty(diagnostics);

    const arg = calledArgs?.[1] as Value;
    ok(arg);

    strictEqual(arg.entityKind, "Value");
    strictEqual(arg.valueKind, "EnumValue");
    strictEqual(arg.value.name, "A");
    strictEqual(arg.value.enum, E);

    // Values have the same structure but are not reference-equal.
    strictEqual(p.defaultValue?.entityKind, "Value");
    strictEqual(p.defaultValue.valueKind, "EnumValue");
    strictEqual(p.defaultValue.value.name, "A");
    strictEqual(p.defaultValue.value.enum, E);
  });

  it("calls function bound to const", async () => {
    const [{ p }, diagnostics] = await tester.compileAndDiagnose(t.code`
        extern fn sum(...addends: valueof int32[]): valueof int32;

        const f = sum;

        model Observer {
          ${t.modelProperty("p")}: int32 = f(1, 2, 3);
        }
      `);

    expectFunctionDiagnosticsEmpty(diagnostics);

    strictEqual(p.defaultValue?.entityKind, "Value");
    strictEqual(p.defaultValue.valueKind, "NumericValue");
    strictEqual(p.defaultValue.value.asNumber(), 6);
  });
});

describe("typekit construction", () => {
  it("can construct array with typekit in impl", async () => {
    tester = BaseTester.files({
      "test.js": mockFile.js({
        $functions: {
          "": {
            makeArray(ctx: FunctionContext, t: Type) {
              return $(ctx.program).array.create(t);
            },
          },
        },
      }),
    })
      .import("./test.js")
      .using("TypeSpec.Reflection");

    const [{ program, p }, diagnostics] = await tester.compileAndDiagnose(t.code`
        extern fn makeArray(T: unknown);
        
        alias X = makeArray(string);

        model M {
          ${t.modelProperty("p")}: X;
        }
      `);

    expectFunctionDiagnosticsEmpty(diagnostics);

    ok(p.type);
    ok($(program).array.is(p.type));

    const arrayIndexerType = p.type.indexer.value;

    ok(arrayIndexerType);
    ok($(program).scalar.isString(arrayIndexerType));
  });
});

describe("specific type constraints", () => {
  let receivedType: Type | undefined;

  beforeEach(() => {
    receivedType = undefined;

    tester = BaseTester.files({
      "test.js": mockFile.js({
        $functions: {
          "": {
            expect(_ctx: FunctionContext, arg: Type) {
              receivedType = arg;
              return arg;
            },
          },
        },
      }),
    })
      .import("./test.js")
      .using("TypeSpec.Reflection");
  });

  async function expectReflectionUsage(
    kind: Type["kind"],
    declaration: string,
    reference: string,
    match: DiagnosticMatch[] = [],
  ) {
    const [{ p }, diagnostics] = await tester.compileAndDiagnose(t.code`
        ${declaration}
        extern fn expect(arg: Reflection.${kind}): Reflection.${kind};

        model Observer {
          ${t.modelProperty("p")}: expect(${reference});
        }
      `);

    expectFunctionDiagnostics(diagnostics, match);

    return p.type;
  }

  async function expectReflectionUsageSimple(
    kind: Extract<Type, { name: string }>["kind"],
    declaration: string,
    reference: string,
  ): Promise<void> {
    const t = await expectReflectionUsage(kind, declaration, reference);

    strictEqual(receivedType?.kind, kind);
    strictEqual(receivedType.name, reference);
    strictEqual(t, receivedType);
  }

  it("accepts Reflection.Model parameter", async () => {
    await expectReflectionUsageSimple("Model", "model TestModel { x: string; }", "TestModel");
  });

  it("accepts Reflection.Enum parameter", async () => {
    await expectReflectionUsageSimple("Enum", "enum TestEnum { A, B }", "TestEnum");
  });

  it("accepts Reflection.Scalar parameter", async () => {
    await expectReflectionUsageSimple("Scalar", "scalar TestScalar extends string;", "TestScalar");
  });

  it("accepts Reflection.Union parameter", async () => {
    const t = await expectReflectionUsage("Union", "", "string | int32");

    strictEqual(receivedType?.kind, "Union");
    strictEqual(receivedType.name, undefined);
    strictEqual(receivedType.variants.size, 2);
    const [stringVariant, intVariant] = receivedType.variants.values();
    strictEqual(stringVariant.type.kind, "Scalar");
    strictEqual(stringVariant.type.name, "string");
    strictEqual(intVariant.type.kind, "Scalar");
    strictEqual(intVariant.type.name, "int32");
    strictEqual(t, receivedType);
  });

  it("accepts Reflection.Interface parameter", async () => {
    await expectReflectionUsageSimple(
      "Interface",
      "interface TestInterface { testOp(): void; }",
      "TestInterface",
    );
  });

  it("accepts Reflection.Namespace parameter", async () => {
    await expectReflectionUsageSimple("Namespace", "namespace TestNs { }", "TestNs");
  });

  it("accepts Reflection.Operation parameter", async () => {
    await expectReflectionUsageSimple("Operation", "op testOp(): string;", "testOp");
  });

  it("errors when wrong type kind is passed", async () => {
    const t = await expectReflectionUsage("Model", "enum TestEnum { A, B }", "TestEnum", [
      {
        code: "unassignable",
        message: "Type 'TestEnum' is not assignable to type 'Model'",
      },
    ]);

    strictEqual(receivedType, undefined);
    // Since we didn't call the function, we get back the constraint type, which is Reflection.Model.
    strictEqual(t.kind, "Model");
    strictEqual(t.name, "Model");
  });
});

describe("value marshalling", () => {
  let receivedValue: any;

  beforeEach(() => {
    receivedValue = undefined;
    tester = BaseTester.files({
      "test.js": mockFile.js({
        $functions: {
          "": {
            expect(_ctx: FunctionContext, arg: any) {
              receivedValue = arg;
              return arg;
            },
            returnInvalidJsValue(_ctx: FunctionContext) {
              return Symbol("invalid");
            },
            returnComplexObject(_ctx: FunctionContext) {
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
      }),
    })
      .import("./test.js")
      .using("TypeSpec.Reflection");
  });

  async function expectValueUsage(
    signature: string,
    argument: string,
    match: DiagnosticMatch[] = [],
  ): Promise<Value | undefined> {
    const [{ p }, diagnostics] = await tester.compileAndDiagnose(t.code`
        ${signature};

        model Observer {
          ${t.modelProperty("p")}: unknown = ${argument};
        }
      `);

    expectFunctionDiagnostics(diagnostics, match);

    return p.defaultValue;
  }

  async function expectValueSimple(valueType: string, argument: any) {
    await expectValueUsage(
      `extern fn expect(v: valueof ${valueType}): valueof ${valueType}`,
      `expect(${JSON.stringify(argument)})`,
    );

    strictEqual(receivedValue, argument);
  }

  it("marshals string values correctly", async () => {
    await expectValueSimple("string", "hello world");
  });

  it("marshals numeric values correctly", async () => {
    await expectValueSimple("int32", 42);
  });

  it("marshals boolean values correctly", async () => {
    await expectValueSimple("boolean", true);
  });

  it("marshals array values correctly", async () => {
    const v = await expectValueUsage(
      `extern fn expect(arr: valueof string[]): valueof string[]`,
      `expect(#["a", "b", "c"])`,
    );

    deepStrictEqual(receivedValue, ["a", "b", "c"]);
    strictEqual(v?.valueKind, "ArrayValue");
    strictEqual(v.values.length, 3);
    const [a, b, c] = v.values;
    strictEqual(a.valueKind, "StringValue");
    strictEqual(a.value, "a");
    strictEqual(b.valueKind, "StringValue");
    strictEqual(b.value, "b");
    strictEqual(c.valueKind, "StringValue");
    strictEqual(c.value, "c");
  });

  it("marshals object values correctly", async () => {
    const v = await expectValueUsage(
      `extern fn expect(obj: valueof {name: string, age: int32}): valueof {name: string, age: int32}`,
      `expect(#{name: "test", age: 25})`,
    );

    strictEqual(receivedValue.name, "test");
    strictEqual(receivedValue.age, 25);

    strictEqual(v?.valueKind, "ObjectValue");
    const props = v.properties;
    strictEqual(props.size, 2);
    const nameProp = props.get("name");
    ok(nameProp);
    strictEqual(nameProp.name, "name");
    strictEqual(nameProp.value.valueKind, "StringValue");
    strictEqual(nameProp.value.value, "test");
    const ageProp = props.get("age");
    ok(ageProp);
    strictEqual(ageProp.name, "age");
    strictEqual(ageProp.value.valueKind, "NumericValue");
    strictEqual(ageProp.value.value.asNumber(), 25);
  });

  it("handles invalid JS return values gracefully", async () => {
    const v = await expectValueUsage(
      `extern fn returnInvalidJsValue(): valueof string`,
      `returnInvalidJsValue()`,
      [
        {
          code: "function-return",
          message: "Function implementation returned invalid JS value 'Symbol(invalid)'.",
        },
      ],
    );

    strictEqual(v, undefined);
  });

  it("unmarshal complex JS objects to values", async () => {
    const v = await expectValueUsage(
      `extern fn returnComplexObject(): valueof unknown`,
      `returnComplexObject()`,
    );

    strictEqual(v?.entityKind, "Value");
    strictEqual(v.valueKind, "ObjectValue");

    const obj = v.properties;
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
    const [{ p }, diagnostics] = await tester.compileAndDiagnose(t.code`
        extern fn returnIndeterminate(): valueof int32;
        extern fn expect(n: valueof int32): valueof int32;
        const X = expect(returnIndeterminate());

        model Observer {
          ${t.modelProperty("p")}: int32 = X;
        }
      `);

    expectFunctionDiagnosticsEmpty(diagnostics);

    strictEqual(p.defaultValue?.entityKind, "Value");
    strictEqual(p.defaultValue?.valueKind, "NumericValue");
    strictEqual(p.defaultValue?.value.asNumber(), 42);
  });

  it("handles indeterminate entities coerced to types", async () => {
    const [{ p }, diagnostics] = await tester.compileAndDiagnose(t.code`
        extern fn returnIndeterminate(): int32;

        alias X = returnIndeterminate();

        model Observer {
          ${t.modelProperty("p")}: X;
        }
      `);

    expectFunctionDiagnosticsEmpty(diagnostics);

    strictEqual(p.type.kind, "Number");
    strictEqual(p.type.value, 42);
  });
});

describe("union type constraints", () => {
  let receivedArg: any;

  beforeEach(() => {
    receivedArg = undefined;

    tester = BaseTester.files({
      "test.js": mockFile.js({
        $functions: {
          "": {
            accept(_ctx: FunctionContext, arg: any) {
              receivedArg = arg;
              return arg;
            },
            returnTypeOrValue(ctx: FunctionContext, returnType: boolean) {
              receivedArg = returnType;
              if (returnType) {
                return ctx.program.checker.getStdType("string");
              } else {
                return "hello";
              }
            },
          },
        },
      }),
    })
      .import("./test.js")
      .using("TypeSpec.Reflection");
  });

  it("accepts type parameter", async () => {
    const diagnostics = await tester.diagnose(`
        extern fn accept(arg: unknown | valueof unknown): unknown;
        
        alias TypeResult = accept(string);
      `);

    expectFunctionDiagnosticsEmpty(diagnostics);

    strictEqual(receivedArg.entityKind, "Type");
    strictEqual(receivedArg.kind, "Scalar");
    strictEqual(receivedArg.name, "string");
  });

  it("prefers value when applicable", async () => {
    const diagnostics = await tester.diagnose(`
        extern fn accept(arg: string | valueof string): valueof string;
        
        const ValueResult = accept("hello");
      `);

    expectFunctionDiagnosticsEmpty(diagnostics);

    strictEqual(receivedArg, "hello");
  });

  it("accepts multiple specific types", async () => {
    const diagnostics = await tester.diagnose(`
        extern fn accept(arg: Reflection.Model | Reflection.Enum): Reflection.Model | Reflection.Enum;
        
        model TestModel {}
        enum TestEnum { A }
        
        alias ModelResult = accept(TestModel);
        alias EnumResult = accept(TestEnum);
      `);

    expectFunctionDiagnosticsEmpty(diagnostics);
  });

  it("accepts multiple value types", async () => {
    const diagnostics = await tester.diagnose(`
        extern fn accept(arg: valueof (string | int32)): valueof (string | int32);
        
        const StringResult = accept("test");
        const NumberResult = accept(42);
      `);

    expectFunctionDiagnosticsEmpty(diagnostics);
  });

  it("errors when argument doesn't match union constraint", async () => {
    const diagnostics = await tester.diagnose(`
        extern fn accept(arg: Reflection.Model | Reflection.Enum): Reflection.Model | Reflection.Enum;
        
        scalar TestScalar extends string;
        alias Result = accept(TestScalar);
      `);

    expectFunctionDiagnostics(diagnostics, {
      code: "unassignable",
      message: "Type 'TestScalar' is not assignable to type 'Model | Enum'",
    });

    strictEqual(receivedArg, undefined);
  });

  it("can return type from function", async () => {
    const [{ p }, diagnostics] = await tester.compileAndDiagnose(t.code`
        extern fn returnTypeOrValue(returnType: valueof boolean): unknown;

        model Observer {
          ${t.modelProperty("p")}: returnTypeOrValue(true);
        }
      `);

    expectFunctionDiagnosticsEmpty(diagnostics);

    strictEqual(receivedArg, true);

    strictEqual(p.type.kind, "Scalar");
    strictEqual(p.type.name, "string");
  });

  it("can return value from function", async () => {
    const [{ p }, diagnostics] = await tester.compileAndDiagnose(t.code`
        extern fn returnTypeOrValue(returnType: valueof boolean): valueof string;
        
        const ValueResult = returnTypeOrValue(false);

        model Observer {
          ${t.modelProperty("p")}: string = ValueResult;
        }
      `);

    expectFunctionDiagnosticsEmpty(diagnostics);

    strictEqual(receivedArg, false);

    strictEqual(p.defaultValue?.entityKind, "Value");
    strictEqual(p.defaultValue?.valueKind, "StringValue");
    strictEqual(p.defaultValue?.value, "hello");
  });
});

describe("error cases and edge cases", () => {
  beforeEach(() => {
    tester = BaseTester.files({
      "test.js": mockFile.js({
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
      }),
    })
      .import("./test.js")
      .using("TypeSpec.Reflection");
  });

  it("errors when function returns wrong entity kind", async () => {
    const diagnostics = await tester.diagnose(`
        extern fn returnWrongEntityKind(): unknown;
        alias X = returnWrongEntityKind();
      `);

    expectFunctionDiagnostics(diagnostics, {
      code: "function-return",
      message:
        "Implementation of 'fn returnWrongEntityKind' returned value '\"string value\"', which is not assignable to the declared return type 'unknown'.",
    });
  });

  it("errors when function returns wrong value type", async () => {
    const diagnostics = await tester.diagnose(`
        extern fn returnWrongValueType(): valueof string;
        const X = returnWrongValueType();
      `);

    expectFunctionDiagnostics(diagnostics, {
      code: "function-return",
      message:
        "Implementation of 'fn returnWrongValueType' returned value '42', which is not assignable to the declared return type 'valueof string'.",
    });
  });

  it("thrown JS error bubbles up as ICE", async () => {
    try {
      await tester.diagnose(`
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
    const [{ p }, diagnostics] = await tester.compileAndDiagnose(t.code`
        extern fn returnUndefined(): valueof unknown;

        model Observer {
          ${t.modelProperty("p")}: unknown = returnUndefined();
        }
      `);

    expectFunctionDiagnosticsEmpty(diagnostics);

    strictEqual(p.defaultValue?.entityKind, "Value");
    strictEqual(p.defaultValue?.valueKind, "NullValue");
  });

  it("handles null return value", async () => {
    const [{ p }, diagnostics] = await tester.compileAndDiagnose(t.code`
        extern fn returnNull(): valueof unknown;
        const X = returnNull();

        model Observer {
          ${t.modelProperty("p")}: unknown = X;
        }
      `);

    expectFunctionDiagnosticsEmpty(diagnostics);

    strictEqual(p.defaultValue?.entityKind, "Value");
    strictEqual(p.defaultValue?.valueKind, "NullValue");
  });

  it("validates required parameter after optional not allowed in regular param position", async () => {
    const diagnostics = await tester.diagnose(`
        extern fn expectNonOptionalAfterOptional(opt?: valueof string, req: valueof string): valueof string;
        const X = expectNonOptionalAfterOptional("test");
      `);

    expectFunctionDiagnostics(diagnostics, {
      code: "required-parameter-first",
      message: "A required parameter cannot follow an optional parameter.",
    });
  });

  it("cannot be used as a type", async () => {
    const diagnostics = await tester.diagnose(`
        extern fn testFn(): unknown;
        
        model M {
          prop: testFn;
        }
      `);

    expectFunctionDiagnostics(diagnostics, {
      code: "value-in-type",
      message: "A value cannot be used as a type.",
    });
  });
});

describe("default function results", () => {
  it("collapses to undefined for missing value-returning function", async () => {
    const [{ p }, diagnostics] = await tester.compileAndDiagnose(t.code`
        extern fn missingValueFn(): valueof string;
        const X = missingValueFn();

        model Observer {
          ${t.modelProperty("p")}: string = X;
        }
      `);

    expectFunctionDiagnostics(diagnostics, {
      code: "missing-implementation",
    });

    strictEqual(p.defaultValue, undefined);
  });

  it("returns default type for missing type-returning function", async () => {
    const [{ p }, diagnostics] = await tester.compileAndDiagnose(t.code`
        extern fn missingTypeFn(): unknown;
        alias X = missingTypeFn();

        model Observer {
          ${t.modelProperty("p")}: X;
        }
      `);

    expectFunctionDiagnostics(diagnostics, {
      code: "missing-implementation",
    });

    strictEqual(p.type.kind, "Intrinsic");
    strictEqual(p.type.name, "unknown");
  });

  it("returns appropriate default for union return type", async () => {
    const [{ p }, diagnostics] = await tester.compileAndDiagnose(t.code`
        extern fn missingUnionFn(): unknown | valueof string;
        const X = missingUnionFn();

        alias T = missingUnionFn();

        model Observer {
          ${t.modelProperty("p")}: T = X;
        }
      `);

    expectFunctionDiagnostics(diagnostics, {
      code: "missing-implementation",
    });

    strictEqual(p.type.kind, "Intrinsic");
    strictEqual(p.type.name, "ErrorType");

    strictEqual(p.defaultValue, undefined);
  });
});

describe("template and generic scenarios", () => {
  beforeEach(() => {
    tester = BaseTester.files({
      "templates.js": mockFile.js({
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
      }),
    })
      .import("./templates.js")
      .using("TypeSpec.Reflection");
  });

  it("works with template aliases", async () => {
    const [{ program, prop }, diagnostics] = await tester.compileAndDiagnose(t.code`
        extern fn processGeneric(T: unknown): unknown;
        
        alias ArrayOf<T> = processGeneric(T);
        
        model TestModel {
          ${t.modelProperty("prop")}: ArrayOf<string>;
        }
      `);

    expectFunctionDiagnosticsEmpty(diagnostics);

    ok(prop.type);
    ok($(program).array.is(prop.type));
  });

  it("works with constrained templates", async () => {
    const diagnostics = await tester.diagnose(`
        extern fn processConstrainedGeneric(T: Reflection.Model): Reflection.Model;
        
        alias ProcessModel<T extends Reflection.Model> = processConstrainedGeneric(T);
        
        model TestModel {}
        alias Result = ProcessModel<TestModel>;
      `);

    expectFunctionDiagnosticsEmpty(diagnostics);
  });

  it("errors when template constraint not satisfied", async () => {
    const diagnostics = await tester.diagnose(`
        extern fn processConstrainedGeneric(T: Reflection.Model): Reflection.Model;
        
        alias ProcessModel<T extends Reflection.Model> = processConstrainedGeneric(T);
        
        enum TestEnum { A }
        alias Result = ProcessModel<TestEnum>;
      `);

    expectFunctionDiagnostics(diagnostics, {
      code: "invalid-argument",
    });
  });

  it("template instantiations of function calls yield identical instances", async () => {
    const [{ program, A, B }, diagnostics] = await tester.compileAndDiagnose(t.code`
        extern fn processGeneric(T: unknown): unknown;
        
        alias ArrayOf<T> = processGeneric(T);
        
        model ${t.model("A")} {
          propA: ArrayOf<string>;
        }
        
        model ${t.model("B")} {
          propB: ArrayOf<string>;
        }
      `);

    expectFunctionDiagnosticsEmpty(diagnostics);

    const aProp = A.properties.get("propA");
    const bProp = B.properties.get("propB");

    ok(aProp);
    ok(bProp);

    ok($(program).array.is(aProp.type));
    ok($(program).array.is(bProp.type));

    strictEqual(aProp.type, bProp.type);
  });
});

describe("assignability of functions to fn types", () => {
  beforeEach(() => {
    tester = BaseTester.files({
      "test.js": mockFile.js({
        $functions: {
          "": {
            testFn(_ctx: FunctionContext, a: string): string {
              return a;
            },
          },
        },
      }),
    }).import("./test.js");
  });

  it("can be assigned to a Function type", async () => {
    const [{ p }, diagnostics] = await tester.compileAndDiagnose(t.code`
        extern fn testFn(a: string): string;

        const f: fn(arg: never) => unknown = testFn;
        
        model Observer {
          ${t.modelProperty("p")}: fn(arg: never) => unknown = f;
        }
      `);

    expectFunctionDiagnosticsEmpty(diagnostics);

    strictEqual(p.defaultValue?.entityKind, "Value");
    strictEqual(p.defaultValue?.valueKind, "Function");
    strictEqual(p.defaultValue?.name, "testFn");
  });

  it("can be assigned to a function type with specified parameters", async () => {
    const [{ p }, diagnostics] = await tester.compileAndDiagnose(t.code`
        extern fn testFn(a: string): string;

        const f: fn(arg: string) => unknown = testFn;

        model Observer {
          ${t.modelProperty("p")}: fn(arg: string) => unknown = f;
        }
      `);

    expectFunctionDiagnosticsEmpty(diagnostics);

    strictEqual(p.defaultValue?.entityKind, "Value");
    strictEqual(p.defaultValue?.valueKind, "Function");
    strictEqual(p.defaultValue?.name, "testFn");
  });

  it("can be assigned to a function type with specified return type", async () => {
    const [{ p }, diagnostics] = await tester.compileAndDiagnose(t.code`
        extern fn testFn(a: string): string;

        const f: fn(arg: never) => string = testFn;

        model Observer {
          ${t.modelProperty("p")}: fn(arg: never) => string = f;
        }
      `);

    expectFunctionDiagnosticsEmpty(diagnostics);

    strictEqual(p.defaultValue?.entityKind, "Value");
    strictEqual(p.defaultValue?.valueKind, "Function");
    strictEqual(p.defaultValue?.name, "testFn");
  });

  it("errors when assigned to function type with incompatible parameters", async () => {
    const diagnostics = await tester.diagnose(`
        extern fn testFn(a: string): string;

        const f: fn(arg: numeric) => string = testFn;
      `);

    expectFunctionDiagnostics(diagnostics, {
      code: "unassignable",
      message:
        "Type 'fn (a: string) => string' is not assignable to type 'fn (arg: numeric) => string'\n  Type 'numeric' is not assignable to type 'string'",
    });
  });

  it("errors when assigned to function type with incompatible return type", async () => {
    const diagnostics = await tester.diagnose(`
        extern fn testFn(a: string): string;

        const f: fn(arg: never) => int32 = testFn;
      `);

    expectFunctionDiagnostics(diagnostics, {
      code: "unassignable",
      message:
        "Type 'fn (a: string) => string' is not assignable to type 'fn (arg: never) => int32'\n  Type 'string' is not assignable to type 'int32'",
    });
  });
});

describe("function type assignability", () => {
  async function diagnoseFunctionAssignment(source: string, target: string) {
    const diagnostics = await tester.diagnose(`
        alias Source = ${source};
        alias Target = ${target};

        model Expect<T extends Target> {}

        alias Test = Expect<Source>;
      `);
    return diagnostics;
  }

  function expectAssignmentOk(source: string, target: string) {
    it(`allows assignment from '${source}' to '${target}'`, async () => {
      const diagnostics = await diagnoseFunctionAssignment(source, target);

      expectDiagnosticEmpty(diagnostics);
    });
  }

  function expectAssignmentErrors(source: string, target: string) {
    it(`disallows assignment from '${source}' to '${target}'`, async () => {
      const diagnostics = await diagnoseFunctionAssignment(source, target);

      expectDiagnostics(diagnostics, { code: "invalid-argument" });
    });
  }

  // Simple valid assignments
  expectAssignmentOk("fn()", "fn()");
  expectAssignmentOk("fn(a: string)", "fn(a: string)");
  expectAssignmentOk("fn() => string", "fn() => string");
  expectAssignmentOk("fn(a: string, b: int32) => boolean", "fn(a: string, b: int32) => boolean");
  expectAssignmentOk("fn() => { x: string }", "fn() => Reflection.Model");

  // Parameter contravariance
  expectAssignmentOk("fn(a: unknown)", "fn(a: string)"); // string -> unknown
  expectAssignmentOk("fn(a: string | int32)", "fn(a: string)"); // string -> string | int32
  expectAssignmentOk("fn(a: Reflection.Model)", "fn(a: { x: string })"); // ModelWithId -> Model

  expectAssignmentOk("fn() => string", "fn() => unknown");
  expectAssignmentOk("fn() => { x: string }", "fn() => Reflection.Model");

  expectAssignmentErrors("fn() => string", "fn() => int32");
  expectAssignmentErrors("fn(a: string)", "fn(a: unknown)"); // unknown -> string
  expectAssignmentErrors("fn(a: string)", "fn(a: string | int32)"); // string | int32 -> string
  expectAssignmentErrors("fn(a: { x: string })", "fn(a: Reflection.Model)"); // Model -> ModelWithId

  expectAssignmentErrors("fn() => unknown", "fn() => string");
  expectAssignmentErrors("fn() => Reflection.Model", "fn() => { x: string }");

  // T | valueof T mixed constraints
  expectAssignmentOk("fn(a: unknown | valueof unknown)", "fn(a: string | valueof string)");
  expectAssignmentOk("fn() => string | valueof string", "fn() => unknown | valueof unknown");
  expectAssignmentOk("fn() => valueof string", "fn() => string | valueof string");
  expectAssignmentOk("fn() => string", "fn() => string | valueof string");

  expectAssignmentErrors("fn(a: string | valueof string)", "fn(a: valueof unknown)");
  expectAssignmentErrors("fn() => valueof unknown", "fn() => string | valueof string");

  // Parameter arity
  expectAssignmentOk("fn()", "fn()");
  expectAssignmentOk("fn()", "fn(a: string)"); // Ok -- source ignores the parameter from the target
  expectAssignmentOk("fn(a: string)", "fn(a: string, b: int32)");

  expectAssignmentErrors("fn(a: string)", "fn()"); // Not ok -- source requires a parameter that target doesn't provide
  expectAssignmentErrors("fn(a: string, b: int32)", "fn(a: string)");

  // Optional parameters
  expectAssignmentOk("fn()", "fn(a?: string)"); // ok -- source ignores the parameter if provided
  expectAssignmentOk("fn(a?: string)", "fn(a: string)"); // ok -- target always provides optional param
  expectAssignmentOk("fn(a: string, b?: int32)", "fn(a: string, b: int32)");
  expectAssignmentOk("fn(a?: string)", "fn()"); // ok - source doesn't require the parameter

  expectAssignmentErrors("fn(a: string)", "fn()"); // not ok -- source requires param that target doesn't provide
  expectAssignmentErrors("fn(a: string)", "fn(a?: string)"); // not ok -- source requires param that target may not provide
  expectAssignmentErrors("fn(a: string, b: int32)", "fn(a: string, b?: int32)");

  // Rest parameters
  expectAssignmentOk("fn(...args: string[])", "fn(...args: string[])");
  expectAssignmentOk("fn(...args: unknown[])", "fn(...args: string[])");
  expectAssignmentOk("fn(...args: valueof string[])", "fn(...args: valueof string[])");

  expectAssignmentErrors("fn(...args: string[])", "fn(...args: unknown[])");
  expectAssignmentErrors("fn(...args: string[])", "fn(...args: valueof string[])");

  // Rest parameters cannot satisfy required params
  expectAssignmentErrors("fn(a: string)", "fn(...args: string[])");
  expectAssignmentErrors("fn(a: string, b: int32)", "fn(...args: unknown[])");
  expectAssignmentErrors("fn(a: string)", "fn(...args: valueof string[])");
  expectAssignmentErrors("fn(a: string, b: int32)", "fn(...args: valueof unknown[])");

  // Rest parameters can satisfy optional params
  expectAssignmentOk("fn()", "fn(...args: string[])");
  expectAssignmentOk("fn(a?: string)", "fn(...args: string[])");
  expectAssignmentOk("fn(a: unknown, b?: unknown)", "fn(a: string, ...args: int32[])"); // string -> unknown, int32? -> unknown?
  expectAssignmentOk("fn()", "fn(...args: valueof string[])");
  expectAssignmentOk("fn(a?: valueof string)", "fn(...args: valueof string[])");
  expectAssignmentOk(
    "fn(a: valueof unknown, b?: valueof unknown)",
    "fn(a: valueof string, ...args: valueof int32[])",
  ); // string -> unknown, int32? -> unknown?
});

describe("calling template arguments", () => {
  beforeEach(() => {
    tester = BaseTester.files({
      "templates.js": mockFile.js({
        $functions: {
          "": {
            f(_ctx: FunctionContext, T: Model) {
              return T.name;
            },
          },
        },
      }),
    })
      .import("./templates.js")
      .using("TypeSpec.Reflection");
  });

  it("does not allow calling an unconstrained template parameter", async () => {
    const diagnostics = await tester.diagnose(`
        model Test<T extends Model, F> {
          p: string = F();
        }
      `);

    expectDiagnostics(diagnostics, {
      code: "non-callable",
      message:
        "Template parameter 'F extends unknown' is not callable. Ensure it is constrained to a function value or callable type (scalar or scalar constructor).",
    });
  });

  it("does not allow calling a template paremeter constrained to a type that is possibly not a function", async () => {
    const diagnostics = await tester.diagnose(`
        model Test<F extends Model | valueof fn() => valueof string> {
          p: string = F();
        }
      `);

    expectDiagnostics(diagnostics, {
      code: "non-callable",
      message:
        "Template parameter 'F extends Model | valueof fn () => valueof string' is not callable. Ensure it is constrained to a function value or callable type (scalar or scalar constructor).",
    });
  });

  it("allows calling a template parameter constrained to a function value", async () => {
    const [{ Instance }, diagnostics] = await tester.compileAndDiagnose(t.code`
        extern fn f(T: Model): valueof string;

        model Foo {}

        model Test<F extends valueof fn(T: Model) => valueof string> {
          p: string = F(Foo);
        }

        model ${t.model("Instance")} is Test<f>;
      `);

    expectFunctionDiagnosticsEmpty(diagnostics);

    const p = Instance.properties.get("p");

    strictEqual(p?.defaultValue?.entityKind, "Value");
    strictEqual(p.defaultValue?.valueKind, "StringValue");
    strictEqual(p.defaultValue?.value, "Foo");
  });
});

describe("function calls within template declarations", () => {
  let receivedTypes: any[] = [];
  let observed: any;

  beforeEach(() => {
    receivedTypes = [];

    tester = BaseTester.files({
      "fns.js": mockFile.js({
        $functions: {
          "": {
            f(_ctx: FunctionContext, T: unknown) {
              receivedTypes.push(T);
              return T;
            },
          },
        },
        $decorators: {
          "": {
            d(_ctx: DecoratorContext, target: any) {},
            test(_ctx: DecoratorContext, target: any) {
              observed = target;
            },
          },
        },
      }),
    })
      .import("./fns.js")
      .using("TypeSpec.Reflection");
  });

  it("does not call a function in a templated model declaration", async () => {
    const diagnostics = await tester.diagnose(`
        extern fn f(T: unknown): valueof unknown;

        model Test<T> {
          p: T = f(T);
        }
      `);

    expectFunctionDiagnosticsEmpty(diagnostics);
    strictEqual(receivedTypes.length, 0);
  });

  it("does not call a function in a templated alias declaration", async () => {
    const diagnostics = await tester.diagnose(`
        extern fn f(T: unknown): valueof unknown;

        alias Test<T> = f(T);
      `);

    expectFunctionDiagnosticsEmpty(diagnostics);
    strictEqual(receivedTypes.length, 0);
  });

  it("does not call a function in a decorator argument of a templated operation declaration", async () => {
    const diagnostics = await tester.diagnose(`
        extern fn f(T: unknown): unknown;
        extern dec d(target: unknown, arg: unknown);

        @d(f(T)) op test<T>(): void;
      `);

    expectFunctionDiagnosticsEmpty(diagnostics);
    strictEqual(receivedTypes.length, 0);
  });

  it("does not call a function in any position of a templated alias to a literal model", async () => {
    const diagnostics = await tester.diagnose(`
        extern fn f(T: unknown): unknown;
        extern dec d(target: unknown, arg: unknown);

        alias Test<T> = {
          @d(f(T)) prop: f(T);
        };
      `);

    expectFunctionDiagnosticsEmpty(diagnostics);
    strictEqual(receivedTypes.length, 0);
  });

  it("calls a function once on instantiation of a templated model", async () => {
    const [{ Instance }, diagnostics] = await tester.compileAndDiagnose(t.code`
        extern fn f(T: unknown): unknown;

        model Test<T> {
          p: f(T);
        }
        
        model ${t.model("Instance")} is Test<string>;
      `);

    expectFunctionDiagnosticsEmpty(diagnostics);
    strictEqual(receivedTypes.length, 1);
    strictEqual(receivedTypes[0].kind, "Scalar");
    strictEqual(receivedTypes[0].name, "string");

    const p = Instance.properties.get("p");

    strictEqual(p?.type.kind, "Scalar");
    strictEqual(p.type.name, "string");
  });

  it("calls a function twice on instantiation of a templated alias to a literal model", async () => {
    const [{ Instance }, diagnostics] = await tester.compileAndDiagnose(t.code`
        extern fn f(T: unknown): unknown;
        extern dec d(target: unknown, arg: unknown);

        alias Test<T> = {
         @d(f(T)) p: f(T);
        };
        
        model ${t.model("Instance")} {
          outer: Test<string>;
        }
      `);

    expectFunctionDiagnosticsEmpty(diagnostics);
    strictEqual(receivedTypes.length, 2);
    strictEqual(receivedTypes[0].kind, "Scalar");
    strictEqual(receivedTypes[0].name, "string");
    strictEqual(receivedTypes[1].kind, "Scalar");
    strictEqual(receivedTypes[1].name, "string");

    const outer = Instance.properties.get("outer");
    ok(outer);

    strictEqual(outer.type.kind, "Model");
    const p = outer.type.properties.get("p");
    ok(p);

    strictEqual(p.type.kind, "Scalar");
    strictEqual(p.type.name, "string");
  });

  it("calls a function on instantiation of a templated operation", async () => {
    const diagnostics = await tester.diagnose(`
        extern fn f(T: unknown): unknown;
        extern dec d(target: unknown, arg: unknown);

        @d(f(T)) op test<T>(): void;
        
        alias Instance = test<string>;
      `);

    expectFunctionDiagnosticsEmpty(diagnostics);
    strictEqual(receivedTypes.length, 1);
    strictEqual(receivedTypes[0].kind, "Scalar");
    strictEqual(receivedTypes[0].name, "string");
  });

  it("calls a function once on instantiation of templated alias through 'model is'", async () => {
    const [{ X }, diagnostics] = await tester.compileAndDiagnose(t.code`
        extern fn f(m: Reflection.Model): { myProperty: string };

        alias F<M extends Model> = f(M);

        model Y {
          id: string;
          myProperty: string;
        }

        
        model ${t.model("X")} is F<Y>;

        // This also checks that 'myProperty' exists as a member symbol of X, resolved from return constraint of 'f'
        @@global.test(X.myProperty);
      `);

    expectFunctionDiagnosticsEmpty(diagnostics);
    strictEqual(receivedTypes.length, 1);
    strictEqual(receivedTypes[0].kind, "Model");
    strictEqual(receivedTypes[0].name, "Y");

    const myProp = X.properties.get("myProperty");
    ok(myProp);
    strictEqual(myProp.type.kind, "Scalar");
    strictEqual(myProp.type.name, "string");

    strictEqual(observed, myProp);
  });
});
