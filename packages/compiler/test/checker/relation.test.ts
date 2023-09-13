import { deepStrictEqual, ok, strictEqual } from "assert";
import { Diagnostic, FunctionParameterNode, Model, Type } from "../../src/core/index.js";
import {
  BasicTestRunner,
  DiagnosticMatch,
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
  beforeEach(async () => {
    const host = await createTestHost();
    host.addJsFile("mock.js", { $mock: () => null });
    runner = createTestWrapper(host);
  });

  async function checkTypeAssignable({ source, target, commonCode }: RelatedTypeOptions): Promise<{
    related: boolean;
    diagnostics: readonly Diagnostic[];
    expectedDiagnosticPos: number;
  }> {
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
        code: "unassignable",
        message: "Type 'string' is not assignable to type 'int32'",
      });
    });

    it("cannot add property where parent model has incompatible indexer", async () => {
      const diagnostics = await runner.diagnose(`
        model Foo extends Record<int32> {
          prop1: string;
        }`);
      expectDiagnostics(diagnostics, {
        code: "unassignable",
        message: "Type 'string' is not assignable to type 'int32'",
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

  describe("string literal target", () => {
    it("can the exact same literal", async () => {
      await expectTypeAssignable({ source: `"foo"`, target: `"foo"` });
    });

    it("emit diagnostic when passing other literal", async () => {
      await expectTypeNotAssignable(
        { source: `"bar"`, target: `"foo"` },
        {
          code: "unassignable",
          message: "Type 'bar' is not assignable to type 'foo'",
        }
      );
    });

    it("emit diagnostic when passing string type", async () => {
      await expectTypeNotAssignable(
        { source: `string`, target: `"foo"` },
        {
          code: "unassignable",
          message: "Type 'string' is not assignable to type 'foo'",
        }
      );
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

  // Need to handle bigint in typespec. https://github.com/Azure/typespec-azure/issues/506
  describe.skip("int64 target", () => {
    it("can assign int64", async () => {
      await expectTypeAssignable({ source: "int64", target: "int64" });
    });

    it("can assign numeric literal between -9223372036854775807 and 9223372036854775808", async () => {
      await expectTypeAssignable({ source: "-9223372036854775807", target: "int64" });
      await expectTypeAssignable({ source: "9223372036854775808", target: "int64" });
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
          message: "Type '3.4e+40' is not assignable to type 'float32'",
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
          message:
            "Property 'bar' is missing on type '(anonymous model)' but required in '(anonymous model)'",
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

    it("can assign a tuple of the same type", async () => {
      await expectTypeAssignable({ source: "[int32, int32]", target: "int32[]" });
    });

    it("can assign a tuple of subtype", async () => {
      await expectTypeAssignable({ source: "[int32, int32, int32]", target: "numeric[]" });
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
          code: "missing-index",
          message: "Index signature for type 'integer' is missing in type '{}'.",
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

  describe("Value target", () => {
    describe("valueof string", () => {
      it("can assign string literal", async () => {
        await expectTypeAssignable({ source: `"foo bar"`, target: "valueof string" });
      });

      it("cannot assign numeric literal", async () => {
        await expectTypeNotAssignable(
          { source: `123`, target: "valueof string" },
          {
            code: "unassignable",
            message: "Type '123' is not assignable to type 'string'",
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
        await expectTypeAssignable({ source: `true`, target: "valueof boolean" });
      });

      it("cannot assign numeric literal", async () => {
        await expectTypeNotAssignable(
          { source: `123`, target: "valueof boolean" },
          {
            code: "unassignable",
            message: "Type '123' is not assignable to type 'boolean'",
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
        await expectTypeAssignable({ source: `12`, target: "valueof int16" });
      });

      it("can assign valueof int8", async () => {
        await expectTypeAssignable({ source: `valueof int8`, target: "valueof int16" });
      });

      it("cannot assign int too large", async () => {
        await expectTypeNotAssignable(
          { source: `123456`, target: "valueof int16" },
          {
            code: "unassignable",
            message: "Type '123456' is not assignable to type 'int16'",
          }
        );
      });

      it("cannot assign float", async () => {
        await expectTypeNotAssignable(
          { source: `12.6`, target: "valueof int16" },
          {
            code: "unassignable",
            message: "Type '12.6' is not assignable to type 'int16'",
          }
        );
      });

      it("cannot assign string literal", async () => {
        await expectTypeNotAssignable(
          { source: `"foo bar"`, target: "valueof int16" },
          {
            code: "unassignable",
            message: "Type 'foo bar' is not assignable to type 'int16'",
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
        await expectTypeAssignable({ source: `12.6`, target: "valueof float32" });
      });

      it("cannot assign string literal", async () => {
        await expectTypeNotAssignable(
          { source: `"foo bar"`, target: "valueof float32" },
          {
            code: "unassignable",
            message: "Type 'foo bar' is not assignable to type 'float32'",
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

    it("can use valueof in template parameter constraints", async () => {
      const diagnostics = await runner.diagnose(`
        model Foo<T extends valueof string> {
          @doc(T)
          prop1: int16;
        }`);
      expectDiagnosticEmpty(diagnostics);
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
});
