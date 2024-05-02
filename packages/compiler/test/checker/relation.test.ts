import { deepStrictEqual, ok, strictEqual } from "assert";
import { beforeEach, describe, it } from "vitest";
import {
  Diagnostic,
  FunctionParameterNode,
  Model,
  Type,
  defineModuleFlags,
} from "../../src/core/index.js";
import {
  BasicTestRunner,
  DiagnosticMatch,
  TestHost,
  createTestHost,
  createTestWrapper,
  expectDiagnosticEmpty,
  expectDiagnostics,
  extractCursor,
} from "../../src/testing/index.js";

interface RelatedTypeOptions {
  source: string;
  target: string;
  commonCode?: string;
}

describe("compiler: checker: type relations", () => {
  let runner: BasicTestRunner;
  let host: TestHost;
  beforeEach(async () => {
    host = await createTestHost();
    runner = createTestWrapper(host);
  });

  async function checkTypeAssignable({ source, target, commonCode }: RelatedTypeOptions): Promise<{
    related: boolean;
    diagnostics: readonly Diagnostic[];
    expectedDiagnosticPos: number;
  }> {
    host.addJsFile("mock.js", {
      $flags: defineModuleFlags({
        decoratorArgMarshalling: "lossless",
      }),
      $mock: () => null,
    });
    const { source: code, pos } = extractCursor(`
    import "./mock.js";
    ${commonCode ?? ""}
    extern dec mock(target: unknown, source: ┆${source}, value: ${target});
   `);
    await runner.compile(code);
    const decDeclaration = runner.program
      .getGlobalNamespaceType()
      .decoratorDeclarations.get("mock");
    const sourceProp = decDeclaration?.parameters[0].type!;
    const targetProp = decDeclaration?.parameters[1].type!;

    const [related, diagnostics] = runner.program.checker.isTypeAssignableTo(
      sourceProp,
      targetProp,
      (decDeclaration?.parameters[0].node! as FunctionParameterNode).type!
    );
    return { related, diagnostics, expectedDiagnosticPos: pos };
  }

  async function checkValueAssignableToConstraint({
    source,
    target,
    commonCode,
  }: RelatedTypeOptions): Promise<{
    related: boolean;
    diagnostics: readonly Diagnostic[];
    expectedDiagnosticPos: number;
  }> {
    const cursor = source.includes("┆") ? "" : "┆";
    const { source: code, pos } = extractCursor(`
      ${commonCode ?? ""}
      model Test<T extends ${target}> {}
      alias Case = Test<${cursor}${source}>;
   `);

    const diagnostics = await runner.diagnose(code);
    return { related: diagnostics.length === 0, diagnostics, expectedDiagnosticPos: pos };
  }

  async function expectTypeAssignable(options: RelatedTypeOptions) {
    const { related, diagnostics } = await checkTypeAssignable(options);
    expectDiagnosticEmpty(diagnostics);
    ok(related, `Type ${options.source} should be assignable to ${options.target}`);
  }

  async function expectTypeNotAssignable(options: RelatedTypeOptions, match: DiagnosticMatch) {
    const { related, diagnostics, expectedDiagnosticPos } = await checkTypeAssignable(options);
    ok(!related, `Type ${options.source} should NOT be assignable to ${options.target}`);
    expectDiagnostics(diagnostics, { ...match, pos: expectedDiagnosticPos });
  }

  async function expectValueAssignableToConstraint(options: RelatedTypeOptions) {
    const { related, diagnostics } = await checkValueAssignableToConstraint(options);
    expectDiagnosticEmpty(diagnostics);
    ok(related, `Value ${options.source} should be assignable to ${options.target}`);
  }

  async function expectValueNotAssignableToConstraint(
    options: RelatedTypeOptions,
    match: DiagnosticMatch
  ) {
    const { related, diagnostics, expectedDiagnosticPos } =
      await checkValueAssignableToConstraint(options);
    ok(!related, `Value ${options.source} should NOT be assignable to ${options.target}`);
    expectDiagnostics(diagnostics, { ...match, pos: expectedDiagnosticPos });
  }

  describe("model with indexer", () => {
    it("can add property of subtype of indexer", async () => {
      const diagnostics = await runner.diagnose(`
        model Foo is Record<int32> {
          prop1: int16;
          prop2: 123;
        }`);
      expectDiagnosticEmpty(diagnostics);
    });

    it("cannot add property incompatible with indexer", async () => {
      const diagnostics = await runner.diagnose(`
        model Foo is Record<int32> {
          prop1: string;
        }`);
      expectDiagnostics(diagnostics, {
        code: "incompatible-indexer",
        message: [
          "Property is incompatible with indexer:",
          "  Type 'string' is not assignable to type 'int32'",
        ].join("\n"),
      });
    });

    it("cannot add property where parent model has incompatible indexer", async () => {
      const diagnostics = await runner.diagnose(`
        model Foo extends Record<int32> {
          prop1: string;
        }`);
      expectDiagnostics(diagnostics, {
        code: "incompatible-indexer",
        message: [
          "Property is incompatible with indexer:",
          "  Type 'string' is not assignable to type 'int32'",
        ].join("\n"),
      });
    });

    it("can intersect 2 record", async () => {
      const { Bar } = (await runner.compile(`
        alias Foo = Record<{foo: string}> & Record<{bar: string}>;
        @test model Bar {foo: Foo}
      `)) as { Bar: Model };
      const Foo = Bar.properties.get("foo")!.type as Model;
      ok(Foo.indexer);
      const indexValue = Foo.indexer.value;
      strictEqual(indexValue.kind, "Model" as const);
      deepStrictEqual([...indexValue.properties.keys()], ["foo", "bar"]);
    });

    it("cannot intersect model with property incompatible with record", async () => {
      const diagnostics = await runner.diagnose(`
        alias A = Record<int32> & {prop1: string};
      `);
      expectDiagnostics(diagnostics, {
        code: "incompatible-indexer",
        message: [
          "Property is incompatible with indexer:",
          "  Type 'string' is not assignable to type 'int32'",
        ].join("\n"),
      });
    });

    it("cannot intersect model with a scalar", async () => {
      const diagnostics = await runner.diagnose(`
        alias A = string & {prop1: string};
      `);
      expectDiagnostics(diagnostics, {
        code: "intersect-non-model",
        message: "Cannot intersect non-model types (including union types).",
      });
    });

    it("cannot intersect array and Record", async () => {
      const diagnostics = await runner.diagnose(`
        alias A = string[] & Record<string>;
      `);
      expectDiagnostics(diagnostics, {
        code: "intersect-invalid-index",
        message: "Cannot intersect an array model.",
      });
    });

    it("cannot intersect array and model", async () => {
      const diagnostics = await runner.diagnose(`
        alias A = string[] & {prop1: string};
      `);
      expectDiagnostics(diagnostics, {
        code: "intersect-invalid-index",
        message: "Cannot intersect an array model.",
      });
    });

    it("spread Record<string> lets other property be non string", async () => {
      const diagnostics = await runner.diagnose(`
        model Foo {
          age: int32;
          enabled: boolean;
          ...Record<string>;
        }
      `);
      expectDiagnosticEmpty(diagnostics);
    });

    it("model is a model that spread record does need to respect indexer", async () => {
      const diagnostics = await runner.diagnose(`
        model Foo {
          age: int32;
          enabled: boolean;
          ...Record<string>;
        }

        model Bar is Foo {
          thisNeedsToBeString: int32;
        }
      `);
      expectDiagnostics(diagnostics, {
        code: "incompatible-indexer",
        message: [
          "Property is incompatible with indexer:",
          "  Type 'int32' is not assignable to type 'string'",
        ].join("\n"),
      });
    });
  });

  describe("unknown target", () => {
    [
      "integer",
      "int8",
      "int16",
      "int32",
      "int64",
      "safeint",
      "uint8",
      "uint16",
      "uint32",
      "uint64",
      "decimal",
      "decimal128",
      "string",
      "numeric",
      "float",
      "Record<string>",
      "bytes",
      "duration",
      "plainDate",
    ].forEach((x) => {
      it(`can assign ${x}`, async () => {
        await expectTypeAssignable({ source: x, target: "unknown" });
      });
    });

    it("can assign string literal", async () => {
      await expectTypeAssignable({ source: `"foo"`, target: "unknown" });
    });

    it("can assign numeric literal", async () => {
      await expectTypeAssignable({ source: `1234.4`, target: "unknown" });
    });
  });

  describe("never source", () => {
    [
      "integer",
      "int8",
      "int16",
      "int32",
      "int64",
      "safeint",
      "uint8",
      "uint16",
      "uint32",
      "uint64",
      "decimal",
      "decimal128",
      "string",
      "numeric",
      "float",
      "Record<string>",
      "bytes",
      "duration",
      "plainDate",
    ].forEach((x) => {
      it(`can assign to ${x}`, async () => {
        await expectTypeAssignable({ source: "never", target: x });
      });
    });
  });

  describe("string target", () => {
    it("can assign string", async () => {
      await expectTypeAssignable({ source: "string", target: "string" });
    });

    it("can assign string literal", async () => {
      await expectTypeAssignable({ source: `"foo"`, target: "string" });
    });

    it("can assign string template with primitives interpolated", async () => {
      await expectTypeAssignable({ source: `"foo \${123} bar"`, target: "string" });
    });

    it("can assign string literal union", async () => {
      await expectTypeAssignable({ source: `"foo" | "bar"`, target: "string" });
    });

    it("emit diagnostic when assigning numeric literal", async () => {
      await expectTypeNotAssignable(
        { source: "123", target: "string" },
        {
          code: "unassignable",
          message: "Type '123' is not assignable to type 'string'",
        }
      );
    });
  });

  describe("custom string target", () => {
    it("accept string within length", async () => {
      await expectTypeAssignable({
        source: `"abcd"`,
        target: "myString",
        commonCode: `@minLength(3) @maxLength(16) scalar myString extends string;`,
      });
    });
    it("validate minValue", async () => {
      await expectTypeNotAssignable(
        {
          source: `"ab"`,
          target: "myString",
          commonCode: `@minLength(3) scalar myString extends string;`,
        },
        {
          code: "unassignable",
          message: `Type '"ab"' is not assignable to type 'myString'`,
        }
      );
    });
    it("validate maxValue", async () => {
      await expectTypeNotAssignable(
        {
          source: `"abcdefg"`,
          target: "myString",
          commonCode: `@maxLength(6) scalar myString extends string;`,
        },
        {
          code: "unassignable",
          message: `Type '"abcdefg"' is not assignable to type 'myString'`,
        }
      );
    });
  });

  describe("string literal target", () => {
    it("can the exact same literal", async () => {
      await expectTypeAssignable({ source: `"foo"`, target: `"foo"` });
    });

    it("can assign equivalent string template", async () => {
      await expectTypeAssignable({ source: `"foo \${123} bar"`, target: `"foo 123 bar"` });
    });

    it("emit diagnostic when passing other literal", async () => {
      await expectTypeNotAssignable(
        { source: `"bar"`, target: `"foo"` },
        {
          code: "unassignable",
          message: `Type '"bar"' is not assignable to type '"foo"'`,
        }
      );
    });

    it("emit diagnostic when passing string type", async () => {
      await expectTypeNotAssignable(
        { source: `string`, target: `"foo"` },
        {
          code: "unassignable",
          message: `Type 'string' is not assignable to type '"foo"'`,
        }
      );
    });
  });

  describe("string template target (serializable as string)", () => {
    it("can assign string literal", async () => {
      await expectTypeAssignable({ source: `"foo 123 bar"`, target: `"foo \${123} bar"` });
    });

    it("can assign string template with primitives interpolated", async () => {
      await expectTypeAssignable({
        source: `"foo \${123} \${"bar"}"`,
        target: `"foo \${123} bar"`,
      });
    });
  });

  describe("int8 target", () => {
    it("can assign int8", async () => {
      await expectTypeAssignable({ source: "int8", target: "int8" });
    });

    it("can assign numeric literal between -128 and 127", async () => {
      await expectTypeAssignable({ source: "123", target: "int8" });
    });

    it("can assign numeric literal union", async () => {
      await expectTypeAssignable({ source: `4 | 123`, target: "int8" });
    });

    it("emit diagnostic when numeric literal is out of range large", async () => {
      await expectTypeNotAssignable(
        { source: `129`, target: "int8" },
        {
          code: "unassignable",
          message: "Type '129' is not assignable to type 'int8'",
        }
      );
    });
    it("emit diagnostic assigning decimal", async () => {
      await expectTypeNotAssignable(
        { source: `21.49`, target: "int8" },
        {
          code: "unassignable",
          message: "Type '21.49' is not assignable to type 'int8'",
        }
      );
    });
  });

  describe("int16 target", () => {
    it("can assign int8", async () => {
      await expectTypeAssignable({ source: "int16", target: "int16" });
    });

    it("can assign numeric literal between -32768 and 32767", async () => {
      await expectTypeAssignable({ source: "-31489", target: "int16" });
    });

    it("emit diagnostic when numeric literal is out of range large", async () => {
      await expectTypeNotAssignable(
        { source: `34000`, target: "int16" },
        {
          code: "unassignable",
          message: "Type '34000' is not assignable to type 'int16'",
        }
      );
    });

    it("emit diagnostic assigning decimal", async () => {
      await expectTypeNotAssignable(
        { source: `31489.49`, target: "int16" },
        {
          code: "unassignable",
          message: "Type '31489.49' is not assignable to type 'int16'",
        }
      );
    });
  });

  describe("int32 target", () => {
    it("can assign int32", async () => {
      await expectTypeAssignable({ source: "int32", target: "int32" });
    });

    it("can assign numeric literal between -2147483648 and 2147483647", async () => {
      await expectTypeAssignable({ source: "-2147483448", target: "int32" });
    });

    it("emit diagnostic when numeric literal is out of range large", async () => {
      await expectTypeNotAssignable(
        { source: `3000000000`, target: "int32" },
        {
          code: "unassignable",
          message: "Type '3000000000' is not assignable to type 'int32'",
        }
      );
    });

    it("emit diagnostic assigning decimal", async () => {
      await expectTypeNotAssignable(
        { source: `125125125.49`, target: "int32" },
        {
          code: "unassignable",
          message: "Type '125125125.49' is not assignable to type 'int32'",
        }
      );
    });
  });

  describe("int64 target", () => {
    it("can assign int64", async () => {
      await expectTypeAssignable({ source: "int64", target: "int64" });
    });

    it("can assign numeric literal between -9223372036854775808 and 9223372036854775807", async () => {
      await expectTypeAssignable({ source: "-9223372036854775808", target: "int64" });
      await expectTypeAssignable({ source: "9223372036854775807", target: "int64" });
    });

    it("emit diagnostic when numeric literal is out of range large", async () => {
      await expectTypeNotAssignable(
        { source: `109223372036854775808`, target: "int64" },
        {
          code: "unassignable",
          message: "Type '109223372036854775808' is not assignable to type 'int64'",
        }
      );
    });

    it("emit diagnostic assigning decimal", async () => {
      await expectTypeNotAssignable(
        { source: `9223372036875808.49`, target: "int64" },
        {
          code: "unassignable",
          message: "Type '9223372036875808.49' is not assignable to type 'int64'",
        }
      );
    });
  });

  describe("integer target", () => {
    [
      "integer",
      "int8",
      "int16",
      "int32",
      "int64",
      "safeint",
      "uint8",
      "uint16",
      "uint32",
      "uint64",
    ].forEach((x) => {
      it(`can assign ${x}`, async () => {
        await expectTypeAssignable({ source: x, target: "integer" });
      });
    });

    it("can assign numeric literal between -2147483648 and 2147483647", async () => {
      await expectTypeAssignable({ source: "123", target: "integer" });
      await expectTypeAssignable({ source: "34000", target: "integer" });
      await expectTypeAssignable({ source: "-2147483448", target: "integer" });
    });

    it("emit diagnostic assigning decimal", async () => {
      await expectTypeNotAssignable(
        { source: `125125125.49`, target: "integer" },
        {
          code: "unassignable",
          message: "Type '125125125.49' is not assignable to type 'integer'",
        }
      );
    });
  });

  describe("float target", () => {
    ["float", "float32", "float64"].forEach((x) => {
      it(`can assign ${x}`, async () => {
        await expectTypeAssignable({ source: x, target: "float" });
      });
    });

    it("can assign decimal literal", async () => {
      await expectTypeAssignable({ source: "12.43", target: "float" });
      await expectTypeAssignable({ source: "34000.43", target: "float" });
      await expectTypeAssignable({ source: "-2147483448.43", target: "float" });
    });

    it("can assign integer literal", async () => {
      await expectTypeAssignable({ source: "987", target: "float" });
    });

    it("emit diagnostic assigning integer", async () => {
      await expectTypeNotAssignable(
        { source: `integer`, target: "float" },
        {
          code: "unassignable",
          message: "Type 'integer' is not assignable to type 'float'",
        }
      );
    });

    it("emit diagnostic assigning other type", async () => {
      await expectTypeNotAssignable(
        { source: `boolean`, target: "float" },
        {
          code: "unassignable",
          message: "Type 'boolean' is not assignable to type 'float'",
        }
      );
    });
  });

  describe("float32 target", () => {
    it("can assign float32", async () => {
      await expectTypeAssignable({ source: "float32", target: "float32" });
    });

    it("can assign numeric literal between -3.4e38, 3.4e38", async () => {
      await expectTypeAssignable({ source: "-123456789.123456789", target: "float32" });
      await expectTypeAssignable({ source: "123456789.123456789", target: "float32" });
      await expectTypeAssignable({ source: "0.0", target: "float32" });
    });

    it("emit diagnostic when numeric literal is out of range large", async () => {
      await expectTypeNotAssignable(
        { source: `3.4e40`, target: "float32" },
        {
          code: "unassignable",
          message: "Type '3.4e40' is not assignable to type 'float32'",
        }
      );
    });
  });

  describe("float64 target", () => {
    it("can assign float32", async () => {
      await expectTypeAssignable({ source: "float32", target: "float64" });
    });
    it("can assign float64", async () => {
      await expectTypeAssignable({ source: "float64", target: "float64" });
    });

    it("can assign numeric literal between -1.79E+308 and 1.79E+308", async () => {
      await expectTypeAssignable({ source: "-123456789.123456789", target: "float64" });
      await expectTypeAssignable({ source: "123456789.123456789", target: "float64" });
      await expectTypeAssignable({ source: "0.0", target: "float64" });
    });
  });

  describe("numeric target", () => {
    [
      "integer",
      "int8",
      "int16",
      "int32",
      "int64",
      "safeint",
      "uint8",
      "uint16",
      "uint32",
      "uint64",
      "float",
      "float32",
      "float64",
      "decimal",
      "decimal128",
    ].forEach((x) => {
      it(`can assign ${x}`, async () => {
        await expectTypeAssignable({ source: x, target: "numeric" });
      });
    });

    it("can assign numeric literal between -2147483648 and 2147483647", async () => {
      await expectTypeAssignable({ source: "123", target: "numeric" });
      await expectTypeAssignable({ source: "123.43", target: "numeric" });
      await expectTypeAssignable({ source: "34000", target: "numeric" });
      await expectTypeAssignable({ source: "34000.43", target: "numeric" });
      await expectTypeAssignable({ source: "-2147483448", target: "numeric" });
      await expectTypeAssignable({ source: "-2147483448.43", target: "numeric" });
    });

    it("emit diagnostic assigning other type", async () => {
      await expectTypeNotAssignable(
        { source: `string`, target: "numeric" },
        {
          code: "unassignable",
          message: "Type 'string' is not assignable to type 'numeric'",
        }
      );
    });
  });

  describe("decimal target", () => {
    it("can assign decimal", async () => {
      await expectTypeAssignable({ source: "decimal", target: "decimal" });
    });
    it("can assign decimal128", async () => {
      await expectTypeAssignable({ source: "decimal128", target: "decimal" });
    });
    it("can assign numeric literals", async () => {
      await expectTypeAssignable({ source: "-2147483448", target: "decimal" });
      await expectTypeAssignable({ source: "2147483448", target: "decimal" });
      await expectTypeAssignable({ source: "2147483448.12390812", target: "decimal" });
    });
  });

  describe("decimal128 target", () => {
    it("can assign decimal128", async () => {
      await expectTypeAssignable({ source: "decimal128", target: "decimal128" });
    });
    it("can assign numeric literals", async () => {
      await expectTypeAssignable({ source: "-2147483448", target: "decimal128" });
      await expectTypeAssignable({ source: "2147483448", target: "decimal128" });
      await expectTypeAssignable({ source: "2147483448.12390812", target: "decimal128" });
    });
  });

  describe("custom numeric target", () => {
    it("accept numeric literal within range", async () => {
      await expectTypeAssignable({
        source: "4",
        target: "myInt",
        commonCode: `@minValue(3) @maxValue(16) scalar myInt extends integer;`,
      });
    });
    it("validate minValue", async () => {
      await expectTypeNotAssignable(
        {
          source: "2",
          target: "myInt",
          commonCode: `@minValue(3) scalar myInt extends integer;`,
        },
        {
          code: "unassignable",
          message: "Type '2' is not assignable to type 'myInt'",
        }
      );
    });
    it("validate maxValue", async () => {
      await expectTypeNotAssignable(
        {
          source: "16",
          target: "myInt",
          commonCode: `@maxValue(15) scalar myInt extends integer;`,
        },
        {
          code: "unassignable",
          message: "Type '16' is not assignable to type 'myInt'",
        }
      );
    });
    it("validate minValueExclusive", async () => {
      await expectTypeNotAssignable(
        {
          source: "3",
          target: "myInt",
          commonCode: `@minValueExclusive(3) scalar myInt extends integer;`,
        },
        {
          code: "unassignable",
          message: "Type '3' is not assignable to type 'myInt'",
        }
      );
    });
    it("validate maxValueExclusive", async () => {
      await expectTypeNotAssignable(
        {
          source: "15",
          target: "myInt",
          commonCode: `@maxValueExclusive(15) scalar myInt extends integer;`,
        },
        {
          code: "unassignable",
          message: "Type '15' is not assignable to type 'myInt'",
        }
      );
    });
  });

  describe("Record<x> target", () => {
    ["Record<string>"].forEach((x) => {
      it(`can assign ${x}`, async () => {
        await expectTypeAssignable({ source: x, target: "Record<string>" });
      });
    });

    it("can assign empty object", async () => {
      await expectTypeAssignable({ source: "{}", target: "Record<string>" });
    });

    it("can assign object with property being the same type", async () => {
      await expectTypeAssignable({ source: "{foo: string}", target: "Record<string>" });
      await expectTypeAssignable({
        source: "{foo: string, bar: string}",
        target: "Record<string>",
      });
    });

    it("can assign object with property being the of subtype type", async () => {
      await expectTypeAssignable({ source: "{foo: int32}", target: "Record<numeric>" });
      await expectTypeAssignable({ source: "{foo: float, bar: int64}", target: "Record<numeric>" });
    });

    it("can assign a record of subtypes", async () => {
      await expectTypeAssignable({ source: "Record<int32>", target: "Record<numeric>" });
    });

    it("can assign object that implement the same indexer", async () => {
      await expectTypeAssignable({
        source: "Foo",
        target: "Record<string>",
        commonCode: `
        model Foo is Record<string> {
          prop1: string;
          prop2: string;
        }
      `,
      });
    });

    it("type with spread indexer allow other properties to no match index", async () => {
      await expectTypeAssignable({
        source: "{age: int32, other: string}",
        target: "Foo",
        commonCode: `
        model Foo {
          age: int32;
          ...Record<string>;
        }
      `,
      });
    });

    it("emit diagnostic assigning other type", async () => {
      await expectTypeNotAssignable(
        { source: `string`, target: "Record<string>" },
        {
          code: "unassignable",
          message: "Type 'string' is not assignable to type 'Record<string>'",
        }
      );
    });

    it("emit diagnostic assigning Record of incompatible type", async () => {
      await expectTypeNotAssignable(
        { source: `Record<int32>`, target: "Record<string>" },
        {
          code: "unassignable",
          message: "Type 'int32' is not assignable to type 'string'",
        }
      );
    });

    it("emit diagnostic if some properties are different type", async () => {
      await expectTypeNotAssignable(
        { source: `{foo: string, bar: int32}`, target: "Record<string>" },
        {
          code: "unassignable",
          message: "Type 'int32' is not assignable to type 'string'",
        }
      );
    });
  });

  describe("models", () => {
    it("can assign empty object", async () => {
      await expectTypeAssignable({ source: "{}", target: "{}" });
    });

    it("can assign object with the same property", async () => {
      await expectTypeAssignable({ source: "{name: string}", target: "{name: string}" });
    });

    it("can assign object with the same properties", async () => {
      await expectTypeAssignable({
        source: "{name: string, age: int32}",
        target: "{name: string, age: int32}",
      });
    });

    it("can assign object with extra properties", async () => {
      await expectTypeAssignable({
        source: "{name: string, age: int32}",
        target: "{name: string}",
      });
    });

    it("can assign object with properties defined via inheritance", async () => {
      await expectTypeAssignable({
        source: "Cat",
        target: "Aging",
        commonCode: `
          model Pet { name: string; age: int32 }
          model Cat extends Pet { meow: boolean }

          model Aging { age: int32 }
        `,
      });
    });

    it("can assign object without some of the optional properties", async () => {
      await expectTypeAssignable({
        source: "{name: string}",
        target: "{name: string, age?: int32}",
      });
    });

    it("emit diagnostic when required property is missing", async () => {
      await expectTypeNotAssignable(
        { source: `{foo: "abc"}`, target: `{foo: string, bar: string}` },
        {
          code: "missing-property",
          message: `Property 'bar' is missing on type '{ foo: "abc" }' but required in '{ foo: string, bar: string }'`,
        }
      );
    });

    it("emit diagnostic when assigning array to {}", async () => {
      await expectTypeNotAssignable(
        { source: `string[]`, target: `{}` },
        {
          code: "missing-index",
          message: "Index signature for type 'integer' is missing in type '{}'.",
        }
      );
    });

    it("emit diagnostic when assigning union of array to {}", async () => {
      await expectTypeNotAssignable(
        { source: `string[] | int32[]`, target: `{}` },
        {
          code: "unassignable",
          message: "Type 'string[] | int32[]' is not assignable to type '{}'",
        }
      );
    });

    describe("recursive models", () => {
      it("compare recursive models", async () => {
        await expectTypeAssignable({
          source: "A",
          target: "B",
          commonCode: `
          model A { a: A }
          model B { a: B }
        `,
        });
      });

      it("emit diagnostic if they don't match", async () => {
        const { related, diagnostics } = await checkTypeAssignable({
          source: "A",
          target: "B",
          commonCode: `
        model A { a: A }
        model B { a: B, b: B }
      `,
        });
        ok(!related);
        expectDiagnostics(diagnostics, {
          code: "missing-property",
          message: "Property 'b' is missing on type 'A' but required in 'B'",
        });
      });
    });
  });

  describe("Array target", () => {
    it("can assign the same array type", async () => {
      await expectTypeAssignable({ source: "string[]", target: "string[]" });
    });

    it("can assign a record of subtypes", async () => {
      await expectTypeAssignable({ source: "int32[]", target: "numeric[]" });
    });

    describe("can assign tuple", () => {
      it("of the same type", async () => {
        await expectTypeAssignable({ source: "[int32, int32]", target: "int32[]" });
      });

      it("of subtype", async () => {
        await expectTypeAssignable({ source: "[int32, int32, int32]", target: "numeric[]" });
      });

      it("validate minItems", async () => {
        await expectTypeNotAssignable(
          {
            source: `["one", string]`,
            target: "Tags",
            commonCode: `@minItems(3) model Tags is string[];`,
          },
          {
            code: "unassignable",
            message: [
              `Type '["one", string]' is not assignable to type 'Tags'`,
              `  Source has 2 element(s) but target requires 3.`,
            ].join("\n"),
          }
        );
      });

      it("validate maxItems", async () => {
        await expectTypeNotAssignable(
          {
            source: `["one", string, "three", "four"]`,
            target: "Tags",
            commonCode: `@maxItems(3) model Tags is string[];`,
          },
          {
            code: "unassignable",
            message: [
              `Type '["one", string, "three", "four"]' is not assignable to type 'Tags'`,
              `  Source has 4 element(s) but target only allows 3.`,
            ].join("\n"),
          }
        );
      });
    });

    it("emit diagnostic assigning other type", async () => {
      await expectTypeNotAssignable(
        { source: `string`, target: "string[]" },
        {
          code: "unassignable",
          message: "Type 'string' is not assignable to type 'string[]'",
        }
      );
    });

    it("emit diagnostic assigning tuple with different type", async () => {
      await expectTypeNotAssignable(
        { source: `["abc", 123]`, target: "string[]" },
        {
          code: "unassignable",
          message: "Type '123' is not assignable to type 'string'",
        }
      );
    });

    it("emit diagnostic assigning empty model expression", async () => {
      await expectTypeNotAssignable(
        { source: `{}`, target: "string[]" },
        {
          code: "unassignable",
          message: "Type '{}' is not assignable to type 'string[]'",
        }
      );
    });
  });

  describe("Tuple target", () => {
    it("can assign the same tuple type", async () => {
      await expectTypeAssignable({ source: "[string, string]", target: "[string, string]" });
    });

    it("can assign a tuple of subtypes", async () => {
      await expectTypeAssignable({ source: "[int32, int32]", target: "[numeric, numeric]" });
    });

    it("can assign a tuple of different subtypes", async () => {
      await expectTypeAssignable({
        source: "[int64, int32, uint8]",
        target: "[numeric, numeric, numeric]",
      });
    });

    it("emit diagnostic when assigning tuple of different length", async () => {
      await expectTypeNotAssignable(
        { source: `[string]`, target: "[string, string]" },
        {
          code: "unassignable",
          message: [
            "Type '[string]' is not assignable to type '[string, string]'",
            "  Source has 1 element(s) but target requires 2.",
          ].join("\n"),
        }
      );
    });
    it("emit diagnostic when assigning a non tuple to a tuple", async () => {
      await expectTypeNotAssignable(
        { source: `string`, target: "[string, string]" },
        {
          code: "unassignable",
          message: "Type 'string' is not assignable to type '[string, string]'",
        }
      );
    });
  });

  describe("Union target", () => {
    it("can assign any of the options", async () => {
      await expectTypeAssignable({ source: "string", target: "string | int32" });
    });

    it("can assign any of the variants", async () => {
      await expectTypeAssignable({
        source: "Choice.yes",
        target: "Choice",
        commonCode: `union Choice {yes: "yes", no: "no" }`,
      });
    });

    it("can a subtype of any of the options", async () => {
      await expectTypeAssignable({ source: "int32", target: "string | numeric" });
    });

    it("emit diagnostic when assigning tuple of different length", async () => {
      await expectTypeNotAssignable(
        { source: `true`, target: "string | int32" },
        {
          code: "unassignable",
          message: "Type 'true' is not assignable to type 'string | int32'",
        }
      );
    });
  });

  describe("Enum target", () => {
    it("can assign same enum", async () => {
      await expectTypeAssignable({
        source: "Foo",
        target: "Foo",
        commonCode: `enum Foo {a, b, c}`,
      });
    });

    it("can a member of the enum", async () => {
      await expectTypeAssignable({
        source: "Foo.a",
        target: "Foo",
        commonCode: `enum Foo {a, b, c}`,
      });
    });

    it("emit diagnostic when assigning member of different enum", async () => {
      await expectTypeNotAssignable(
        {
          source: `Bar.a`,
          target: "Foo",
          commonCode: `
            enum Foo {a, b, c};
            enum Bar {a, b, c}`,
        },
        {
          code: "unassignable",
          message: "Type 'Bar.a' is not assignable to type 'Foo'",
        }
      );
    });
  });

  describe("Template constraint", () => {
    it("validate template usage using template constraint", async () => {
      const diagnostics = await runner.diagnose(`
        model Test<T extends TypeSpec.Reflection.EnumMember> {
          t: Target<T>;
        }

        model Target<T extends TypeSpec.Reflection.EnumMember> {
          t: T;
        }
        `);

      expectDiagnosticEmpty(diagnostics);
    });

    describe("using template parameter as a constraint", () => {
      it("pass if the argument is assignable to the constraint", async () => {
        const diagnostics = await runner.diagnose(`
          model Template<A, B extends A> {
            a: A;
            b: B;
          }

          model Test {
            t: Template<{a: string}, {a: string}>;
          }
        `);

        expectDiagnosticEmpty(diagnostics);
      });

      it("pass with multiple constraints", async () => {
        const diagnostics = await runner.diagnose(`
          model Template<A, B extends A, C extends B> {
            a: A;
            b: B;
            c: C;
          }

          model Test {
            t: Template<{a: string}, {a: string, b: string}, {a: string, b: string}>;
          }
        `);

        expectDiagnosticEmpty(diagnostics);
      });

      it("fail if the argument is not assignable to the constraint", async () => {
        const diagnostics = await runner.diagnose(`
          model Template<A, B extends A> {
            a: A;
            b: B;
          }

          model Test {
            t: Template<{a: string}, {b: string}>;
          }
        `);

        expectDiagnostics(diagnostics, {
          code: "invalid-argument",
          message: `Argument of type '{ b: string }' is not assignable to parameter of type '{ a: string }'`,
        });
      });

      it("respect the constraint when using in another template", async () => {
        const diagnostics = await runner.diagnose(`
          model Other<T extends {a: string}> {
            t: T
          }

          model Template<A extends {a: string}, B extends A> {
            t: Other<B>;
          }
          `);

        expectDiagnosticEmpty(diagnostics);
      });
    });
  });

  describe("Reflection", () => {
    function testReflectionType(name: Type["kind"], ref: string, code: string) {
      describe(`Reflection.${name}`, () => {
        it(`can assign ${name}`, async () => {
          await expectTypeAssignable({
            source: ref,
            target: `TypeSpec.Reflection.${name}`,
            commonCode: code,
          });
        });

        it(`cannot assign union of ${name}`, async () => {
          await expectTypeNotAssignable(
            {
              source: `${ref} | ${ref}`,
              target: `TypeSpec.Reflection.${name}`,
              commonCode: code,
            },
            { code: "unassignable" }
          );
        });
      });
    }

    testReflectionType("Enum", "Foo", `enum Foo {a, b, c}`);
    testReflectionType("EnumMember", "Foo.a", `enum Foo {a, b, c}`);
    testReflectionType("Interface", "Foo", `interface Foo {a(): void}`);
    testReflectionType("Model", "Foo", `model Foo {a: string, b: string}`);
    testReflectionType("ModelProperty", "Foo.a", `model Foo {a: string, b: string}`);
    testReflectionType("Namespace", "Foo", `namespace Foo {}`);
    testReflectionType("Operation", "foo", `op foo(): void;`);
    testReflectionType("Scalar", "foo", `scalar foo;`);
    describe(`Reflection.Union`, () => {
      it(`can assign union expression`, async () => {
        await expectTypeAssignable({
          source: "Foo",
          target: `TypeSpec.Reflection.Union`,
          commonCode: `alias Foo = "abc" | "def";`,
        });
      });
      it(`can assign named union`, async () => {
        await expectTypeAssignable({
          source: "Foo",
          target: `TypeSpec.Reflection.Union`,
          commonCode: `union Foo {a: string, b: int32};`,
        });
      });
    });
    testReflectionType("UnionVariant", "Foo.a", `union Foo {a: string, b: int32};`);
  });

  describe("Value constraint", () => {
    describe("valueof string", () => {
      it("can assign string literal", async () => {
        await checkValueAssignableToConstraint({ source: `"foo bar"`, target: "string" });
      });

      it("cannot assign numeric literal", async () => {
        await expectValueNotAssignableToConstraint(
          { source: `123`, target: "valueof string" },
          {
            code: "invalid-argument",
            message:
              "Argument of type '123' is not assignable to parameter of type 'valueof string'",
          }
        );
      });

      it("cannot assign string scalar", async () => {
        await expectTypeNotAssignable(
          { source: `string`, target: "valueof string" },
          {
            code: "unassignable",
            message: "Type 'string' is not assignable to type 'valueof string'",
          }
        );
      });
    });

    describe("valueof boolean", () => {
      it("can assign boolean literal", async () => {
        await expectValueAssignableToConstraint({ source: `true`, target: "valueof boolean" });
      });

      it("cannot assign numeric literal", async () => {
        await expectValueNotAssignableToConstraint(
          { source: `123`, target: "valueof boolean" },
          {
            code: "invalid-argument",
            message:
              "Argument of type '123' is not assignable to parameter of type 'valueof boolean'",
          }
        );
      });

      it("cannot assign boolean scalar", async () => {
        await expectTypeNotAssignable(
          { source: `boolean`, target: "valueof boolean" },
          {
            code: "unassignable",
            message: "Type 'boolean' is not assignable to type 'valueof boolean'",
          }
        );
      });
    });

    describe("valueof int16", () => {
      it("can assign int16 literal", async () => {
        await expectValueAssignableToConstraint({ source: `12`, target: "valueof int16" });
      });

      it("can assign valueof int8", async () => {
        await expectTypeAssignable({ source: `valueof int8`, target: "valueof int16" });
      });

      it("cannot assign int too large", async () => {
        await expectValueNotAssignableToConstraint(
          { source: `123456`, target: "valueof int16" },
          {
            code: "invalid-argument",
            message:
              "Argument of type '123456' is not assignable to parameter of type 'valueof int16'",
          }
        );
      });

      it("cannot assign float", async () => {
        await expectValueNotAssignableToConstraint(
          { source: `12.6`, target: "valueof int16" },
          {
            code: "invalid-argument",
            message:
              "Argument of type '12.6' is not assignable to parameter of type 'valueof int16'",
          }
        );
      });

      it("cannot assign string literal", async () => {
        await expectValueNotAssignableToConstraint(
          { source: `"foo bar"`, target: "valueof int16" },
          {
            code: "invalid-argument",
            message: `Argument of type '"foo bar"' is not assignable to parameter of type 'valueof int16'`,
          }
        );
      });

      it("cannot assign int16 scalar", async () => {
        await expectTypeNotAssignable(
          { source: `int16`, target: "valueof int16" },
          {
            code: "unassignable",
            message: "Type 'int16' is not assignable to type 'valueof int16'",
          }
        );
      });
    });

    describe("valueof float32", () => {
      it("can assign float32 literal", async () => {
        await expectValueAssignableToConstraint({ source: `12.6`, target: "valueof float32" });
      });

      it("cannot assign string literal", async () => {
        await expectValueNotAssignableToConstraint(
          { source: `"foo bar"`, target: "valueof float32" },
          {
            code: "invalid-argument",
            message: `Argument of type '"foo bar"' is not assignable to parameter of type 'valueof float32'`,
          }
        );
      });

      it("cannot assign float32 scalar", async () => {
        await expectTypeNotAssignable(
          { source: `float32`, target: "valueof float32" },
          {
            code: "unassignable",
            message: "Type 'float32' is not assignable to type 'valueof float32'",
          }
        );
      });
    });

    describe("valueof model", () => {
      it("can assign object literal", async () => {
        await expectValueAssignableToConstraint({
          source: `#{name: "foo"}`,
          target: "valueof Info",
          commonCode: `model Info { name: string }`,
        });
      });

      it("can assign object literal with optional properties", async () => {
        await expectValueAssignableToConstraint({
          source: `#{name: "foo"}`,
          target: "valueof Info",
          commonCode: `model Info { name: string, age?: int32 }`,
        });
      });

      it("can assign object literal with additional properties", async () => {
        await expectValueAssignableToConstraint({
          source: `#{age: 21, name: "foo"}`,
          target: "valueof Info",
          commonCode: `model Info { age: int32, ...Record<string> }`,
        });
      });

      // Disabled for now as this is allowed for backcompat
      it.skip("cannot assign a model ", async () => {
        await expectTypeNotAssignable(
          {
            source: `{name: "foo"}`,
            target: "valueof Info",
            commonCode: `model Info { name: string }`,
          },
          {
            code: "unassignable",
            message: "Type '(anonymous model)' is not assignable to type 'valueof Info'",
          }
        );
      });

      describe("excess properties", () => {
        it("emit diagnostic when using extra properties", async () => {
          await expectValueNotAssignableToConstraint(
            {
              source: `#{name: "foo", notDefined: "bar"}`,
              target: "valueof Info",
              commonCode: `model Info { name: string }`,
            },
            {
              code: "invalid-argument",
              message: `Argument of type '#{name: "foo", notDefined: "bar"}' is not assignable to parameter of type 'valueof Info'`,
            }
          );
        });

        it("don't emit diagnostic when the extra props are spread into it", async () => {
          await expectValueAssignableToConstraint({
            source: `#{name: "foo", ...common}`,
            target: "valueof Info",
            commonCode: `
              const common = #{notDefined: "bar"};
              model Info { name: string }
              `,
          });
        });
      });

      it("cannot assign a tuple literal", async () => {
        await expectValueNotAssignableToConstraint(
          {
            source: `#["foo"]`,
            target: "valueof Info",
            commonCode: `model Info { name: string }`,
          },
          {
            code: "invalid-argument",
            message: `Argument of type '#["foo"]' is not assignable to parameter of type 'valueof Info'`,
          }
        );
      });

      it("cannot assign string scalar", async () => {
        await expectTypeNotAssignable(
          { source: `string`, target: "valueof Info", commonCode: `model Info { name: string }` },
          {
            code: "unassignable",
            message: "Type 'string' is not assignable to type 'valueof Info'",
          }
        );
      });
    });

    describe("valueof array", () => {
      it("can assign tuple literal", async () => {
        await expectValueAssignableToConstraint({
          source: `#["foo"]`,
          target: "valueof string[]",
        });
      });

      it("can assign tuple literal of object literal", async () => {
        await expectValueAssignableToConstraint({
          source: `#[#{name: "a"}, #{name: "b"}]`,
          target: "valueof Info[]",
          commonCode: `model Info { name: string }`,
        });
      });

      // Disabled for now as this is allowed for backcompat
      it.skip("cannot assign a tuple", async () => {
        await expectValueNotAssignableToConstraint(
          {
            source: `["foo"]`,
            target: "valueof string[]",
          },
          {
            code: "unassignable",
            message: `Type '["foo"]' is not assignable to type 'valueof string[]'`,
          }
        );
      });

      it("cannot assign an object literal", async () => {
        await expectValueNotAssignableToConstraint(
          {
            source: `#{name: "foo"}`,
            target: "valueof string[]",
          },
          {
            code: "invalid-argument",
            message: `Argument of type '#{name: "foo"}' is not assignable to parameter of type 'valueof string[]'`,
          }
        );
      });

      it("cannot assign string scalar", async () => {
        await expectTypeNotAssignable(
          { source: `string`, target: "valueof string[]" },
          {
            code: "unassignable",
            message: "Type 'string' is not assignable to type 'valueof string[]'",
          }
        );
      });
    });

    describe("valueof tuple", () => {
      it("can assign tuple literal", async () => {
        await expectValueAssignableToConstraint({
          source: `#["foo", 12]`,
          target: "valueof [string, int32]",
        });
      });

      it("cannot assign tuple literal with too few values", async () => {
        await expectValueNotAssignableToConstraint(
          {
            source: `#["foo"]`,
            target: "valueof [string, string]",
          },
          {
            code: "invalid-argument",
            message: `Argument of type '#["foo"]' is not assignable to parameter of type 'valueof [string, string]'`,
          }
        );
      });

      it("cannot assign tuple literal with too many values", async () => {
        await expectValueNotAssignableToConstraint(
          {
            source: `#["a", "b", "c"]`,
            target: "valueof [string, string]",
          },
          {
            code: "invalid-argument",
            message: `Argument of type '#["a", "b", "c"]' is not assignable to parameter of type 'valueof [string, string]'`,
          }
        );
      });
    });

    describe("valueof union", () => {
      it("can assign tuple literal variant", async () => {
        await expectValueAssignableToConstraint({
          source: `#["foo", 12]`,
          target: "valueof ([string, int32] | string | boolean)",
        });
      });
      it("can assign string variant", async () => {
        await expectValueAssignableToConstraint({
          source: `"foo"`,
          target: "valueof ([string, int32] | string | boolean)",
        });
      });
    });

    it("can use valueof in template parameter constraints", async () => {
      const diagnostics = await runner.diagnose(`
        model Foo<T extends valueof string> {
          @doc(T)
          prop1: int16;
        }`);
      expectDiagnosticEmpty(diagnostics);
    });

    it("valueof X template constraint cannot be used as a type", async () => {
      const diagnostics = await runner.diagnose(`
        model Foo<T extends valueof string> {
          kind: T;
        }`);
      expectDiagnostics(diagnostics, {
        code: "value-in-type",
        message: "Template parameter can be passed values but is used as a type.",
      });
    });

    it("can use valueof unknown constraint not assignable to unknown", async () => {
      const { source, pos } = extractCursor(`
      model A<T extends unknown> {}
      model B<T extends valueof unknown> is A<┆T> {}`);
      const diagnostics = await runner.diagnose(source);
      expectDiagnostics(diagnostics, {
        code: "invalid-argument",
        message: "Argument of type 'T' is not assignable to parameter of type 'unknown'",
        pos,
      });
    });

    // BackCompat added May 2023 Sprint: by June 2023 sprint. From this PR: https://github.com/microsoft/typespec/pull/1877
    it("BACKCOMPAT: can use valueof in template parameter constraints", async () => {
      const diagnostics = await runner.diagnose(`
        model Foo<T extends string> {
          @doc(T)
          prop1: int16;
        }`);
      expectDiagnostics(diagnostics, {
        code: "deprecated",
        message:
          "Deprecated: Template constrainted to 'string' will not be assignable to 'valueof string' in the future. Update the constraint to be 'valueof string'",
      });
    });
  });

  /** Describe the relation between types and values in TypeSpec */
  describe("value vs type constraints", () => {
    describe("cannot assign a value to a type constraint", () => {
      it.each([
        ["#{}", "{}"],
        ["#{}", "unknown"],
        ["#[]", "unknown[]"],
        ["#[]", "unknown"],
      ])(`%s => %s`, async (source, target) => {
        await expectValueNotAssignableToConstraint(
          { source, target },
          { code: "invalid-argument" }
        );
      });
    });

    // Disabled for now as this is allowed for transition to value types
    describe.skip("cannot assign a type to a value constraint", () => {
      it.each([
        ["{}", "valueof unknown"],
        ["{}", "valueof {}"],
      ])(`%s => %s`, async (source, target) => {
        await expectTypeNotAssignable({ source, target }, { code: "unassignable" });
      });
    });

    describe("can assign types or values when constraint accept both", () => {
      it.each([
        ["#{}", "(valueof unknown) | unknown"],
        ["#{}", "(valueof {}) | {}"],
      ])(`%s => %s`, async (source, target) => {
        await expectValueAssignableToConstraint({ source, target });
      });
      it.each([
        ["{}", "(valueof unknown) | unknown"],
        ["{}", "(valueof {}) | {}"],
        ["(valueof {}) | {}", "(valueof {}) | {} | (valueof []) | []"],
        ["(valueof {}) | {}", "(valueof {}) | {}"],
      ])(`%s => %s`, async (source, target) => {
        await expectTypeAssignable({ source, target });
      });
    });
  });
});
