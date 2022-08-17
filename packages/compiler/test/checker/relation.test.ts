import { deepStrictEqual, ok, strictEqual } from "assert";
import { isNeverIndexer, Model } from "../../core/index.js";
import {
  BasicTestRunner,
  createTestHost,
  createTestWrapper,
  DiagnosticMatch,
  expectDiagnosticEmpty,
  expectDiagnostics,
} from "../../testing/index.js";

interface RelatedTypeOptions {
  source: string;
  target: string;
  commonCode?: string;
}

describe("compiler: checker: type relations", () => {
  let runner: BasicTestRunner;
  beforeEach(async () => {
    runner = createTestWrapper(await createTestHost(), (x) => x);
  });

  async function checkTypeAssignable({ source, target, commonCode }: RelatedTypeOptions) {
    const { Test } = (await runner.compile(`
    ${commonCode ?? ""}
    
    @test model Test {
      source: ${source};
      target: ${target};
    }`)) as { Test: Model };
    const sourceProp = Test.properties.get("source")!.type;
    const targetProp = Test.properties.get("target")!.type;
    return runner.program.checker.isTypeAssignableTo(sourceProp, targetProp, targetProp);
  }

  async function expectTypeAssignable(options: RelatedTypeOptions) {
    const [related, diagnostics] = await checkTypeAssignable(options);
    expectDiagnosticEmpty(diagnostics);
    ok(related, `Type ${options.source} should be assignable to ${options.target}`);
  }

  async function expectTypeNotAssignable(
    options: RelatedTypeOptions,
    match: DiagnosticMatch | DiagnosticMatch[]
  ) {
    const [related, diagnostics] = await checkTypeAssignable(options);
    ok(!related, `Type ${options.source} should NOT be assignable to ${options.target}`);
    expectDiagnostics(diagnostics, match);
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

    it("cannot add property to primitive type", async () => {
      const diagnostics = await runner.diagnose(`
        model Foo is string {
          prop1: string;
        }`);
      expectDiagnostics(diagnostics, {
        code: "no-prop",
        message: "Property 'prop1' cannot be defined because model cannot hold properties.",
      });
    });

    it("cannot add property incompatible with indexer", async () => {
      const diagnostics = await runner.diagnose(`
        model Foo is Record<int32> {
          prop1: string;
        }`);
      expectDiagnostics(diagnostics, {
        code: "unassignable",
        message: "Type 'Cadl.string' is not assignable to type 'Cadl.int32'",
      });
    });

    it("can intersect 2 record", async () => {
      const { Bar } = (await runner.compile(`
        alias Foo = Record<{foo: string}> & Record<{bar: string}>;
        @test model Bar {foo: Foo}
      `)) as { Bar: Model };
      const Foo = Bar.properties.get("foo")!.type as Model;
      ok(Foo.indexer);
      ok(!isNeverIndexer(Foo.indexer));
      const indexValue = Foo.indexer.value;
      strictEqual(indexValue.kind, "Model" as const);
      deepStrictEqual([...indexValue.properties.keys()], ["foo", "bar"]);
    });

    it("cannot intersect model with properties and a primitive type", async () => {
      const diagnostics = await runner.diagnose(`
        alias A = string & {prop1: string};
      `);
      expectDiagnostics(diagnostics, {
        code: "intersect-invalid-index",
        message: "Cannot intersect a model that cannot hold properties.",
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
      "string",
      "numeric",
      "float",
      "object",
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

  describe("string target", () => {
    it("can assign string", async () => {
      await expectTypeAssignable({ source: "string", target: "string" });
    });

    it("can assign string literal", async () => {
      await expectTypeAssignable({ source: `"foo"`, target: "string" });
    });

    it("emit diagnostic when assigning numericl literal", async () => {
      await expectTypeNotAssignable(
        { source: "123", target: "string" },
        {
          code: "unassignable",
          message: "Type '123' is not assignable to type 'Cadl.string'",
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
          message: "Type 'Cadl.string' is not assignable to type 'foo'",
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

    it("emit diagnostic when numeric literal is out of range large", async () => {
      await expectTypeNotAssignable(
        { source: `129`, target: "int8" },
        {
          code: "unassignable",
          message: "Type '129' is not assignable to type 'Cadl.int8'",
        }
      );
    });
    it("emit diagnostic assigning decimal", async () => {
      await expectTypeNotAssignable(
        { source: `21.49`, target: "int8" },
        {
          code: "unassignable",
          message: "Type '21.49' is not assignable to type 'Cadl.int8'",
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
          message: "Type '34000' is not assignable to type 'Cadl.int16'",
        }
      );
    });

    it("emit diagnostic assigning decimal", async () => {
      await expectTypeNotAssignable(
        { source: `31489.49`, target: "int16" },
        {
          code: "unassignable",
          message: "Type '31489.49' is not assignable to type 'Cadl.int16'",
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
          message: "Type '3000000000' is not assignable to type 'Cadl.int32'",
        }
      );
    });

    it("emit diagnostic assigning decimal", async () => {
      await expectTypeNotAssignable(
        { source: `125125125.49`, target: "int32" },
        {
          code: "unassignable",
          message: "Type '125125125.49' is not assignable to type 'Cadl.int32'",
        }
      );
    });
  });

  // Need to handle bigint in cadl. https://github.com/Azure/cadl-azure/issues/506
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
          message: "Type '109223372036854775808' is not assignable to type 'Cadl.int64'",
        }
      );
    });

    it("emit diagnostic assigning decimal", async () => {
      await expectTypeNotAssignable(
        { source: `9223372036875808.49`, target: "int64" },
        {
          code: "unassignable",
          message: "Type '9223372036875808.49' is not assignable to type 'Cadl.int64'",
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
          message: "Type '125125125.49' is not assignable to type 'Cadl.integer'",
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
          message: "Type 'Cadl.integer' is not assignable to type 'Cadl.float'",
        }
      );
    });

    it("emit diagnostic assigning other type", async () => {
      await expectTypeNotAssignable(
        { source: `boolean`, target: "float" },
        {
          code: "unassignable",
          message: "Type 'Cadl.boolean' is not assignable to type 'Cadl.float'",
        }
      );
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
          message: "Type 'Cadl.string' is not assignable to type 'Cadl.numeric'",
        }
      );
    });
  });

  describe("object target", () => {
    ["object", "Record<string>", "Record<int32>"].forEach((x) => {
      it(`can assign ${x}`, async () => {
        await expectTypeAssignable({ source: x, target: "object" });
      });
    });

    it("can assign empty object", async () => {
      await expectTypeAssignable({ source: "{}", target: "object" });
    });

    it("can assign object with proprety", async () => {
      await expectTypeAssignable({ source: "{foo: string}", target: "object" });
    });

    it("emit diagnostic assigning to model expression", async () => {
      await expectTypeNotAssignable(
        { source: `string`, target: "{}" },
        {
          code: "unassignable",
          message: "Type 'Cadl.string' is not assignable to type '{}'",
        }
      );
    });

    it("emit diagnostic assigning other type", async () => {
      await expectTypeNotAssignable(
        { source: `string`, target: "object" },
        {
          code: "unassignable",
          message: "Type 'Cadl.string' is not assignable to type 'Cadl.object'",
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

    it("emit diagnostic assigning other type", async () => {
      await expectTypeNotAssignable(
        { source: `string`, target: "Record<string>" },
        {
          code: "unassignable",
          message: "Type 'Cadl.string' is not assignable to type 'Cadl.Record<Cadl.string>'",
        }
      );
    });

    it("emit diagnostic assigning Record of incompatible type", async () => {
      await expectTypeNotAssignable(
        { source: `Record<int32>`, target: "Record<string>" },
        {
          code: "unassignable",
          message: "Type 'Cadl.int32' is not assignable to type 'Cadl.string'",
        }
      );
    });

    it("emit diagnostic if some properties are different type", async () => {
      await expectTypeNotAssignable(
        { source: `{foo: string, bar: int32}`, target: "Record<string>" },
        {
          code: "unassignable",
          message: "Type 'Cadl.int32' is not assignable to type 'Cadl.string'",
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
          model Cat extends Pet { moew: boolean }

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
          message: "Type 'Cadl.string' is not assignable to type 'Cadl.string[]'",
        }
      );
    });

    it("emit diagnostic assigning tuple with different type", async () => {
      await expectTypeNotAssignable(
        { source: `["abc", 123]`, target: "string[]" },
        {
          code: "unassignable",
          message: "Type '123' is not assignable to type 'Cadl.string'",
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
            "Type '[Cadl.string]' is not assignable to type '[Cadl.string, Cadl.string]'",
            "  Source has 1 element(s) but target requires 2.",
          ].join("\n"),
        }
      );
    });
  });

  describe("Union target", () => {
    it("can assign any of the options", async () => {
      await expectTypeAssignable({ source: "string", target: "string | int32" });
    });

    it("can a subtype of any of the options", async () => {
      await expectTypeAssignable({ source: "int32", target: "string | numeric | object" });
    });

    it("emit diagnostic when assigning tuple of different length", async () => {
      await expectTypeNotAssignable(
        { source: `true`, target: "string | int32" },
        {
          code: "unassignable",
          message: "Type 'true' is not assignable to type 'Cadl.string | Cadl.int32'",
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

    it("can a memeber of the enum", async () => {
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
});
