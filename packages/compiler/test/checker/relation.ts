import { ok } from "assert";
import { ModelType } from "../../core/index.js";
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

describe.only("compiler: checker: intrinsic", () => {
  let runner: BasicTestRunner;
  beforeEach(async () => {
    runner = createTestWrapper(await createTestHost(), (x) => x);
  });

  async function checkTypeRelated({ source, target, commonCode }: RelatedTypeOptions) {
    const { Test } = (await runner.compile(`
    ${commonCode ?? ""}
    
    @test model Test {
      source: ${source};
      target: ${target};
    }`)) as { Test: ModelType };
    const sourceProp = Test.properties.get("source")!.type;
    const targetProp = Test.properties.get("target")!.type;
    return runner.program.checker.isTypeRelatedTo(sourceProp, targetProp);
  }

  async function expectTypeRelated(options: RelatedTypeOptions) {
    const [related, diagnostics] = await checkTypeRelated(options);
    expectDiagnosticEmpty(diagnostics);
    ok(related, `Type ${options.source} should be assignable to ${options.target}`);
  }

  async function expectTypeNotRelated(
    options: RelatedTypeOptions,
    match: DiagnosticMatch | DiagnosticMatch[]
  ) {
    const [related, diagnostics] = await checkTypeRelated(options);
    ok(!related, `Type ${options.source} should NOT be assignable to ${options.target}`);
    expectDiagnostics(diagnostics, match);
  }

  describe("string target", () => {
    it("can assign string", async () => {
      await expectTypeRelated({ source: "string", target: "string" });
    });

    it("can assign string literal", async () => {
      await expectTypeRelated({ source: `"foo"`, target: "string" });
    });

    it("can assign string literal", async () => {
      await expectTypeNotRelated(
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
      await expectTypeRelated({ source: `"foo"`, target: `"foo"` });
    });

    it("emit diagnostic when passing other literal", async () => {
      await expectTypeNotRelated(
        { source: `"bar"`, target: `"foo"` },
        {
          code: "unassignable",
          message: "Type 'bar' is not assignable to type 'foo'",
        }
      );
    });

    it("emit diagnostic when passing string type", async () => {
      await expectTypeNotRelated(
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
      await expectTypeRelated({ source: "int8", target: "int8" });
    });

    it("can assign numeric literal between -128 and 127", async () => {
      await expectTypeRelated({ source: "123", target: "int8" });
    });

    it("emit diagnostic when numeric literal is out of range large", async () => {
      await expectTypeNotRelated(
        { source: `129`, target: "int8" },
        {
          code: "unassignable",
          message: "Type '129' is not assignable to type 'Cadl.int8'",
        }
      );
    });
    it("emit diagnostic assigning decimal", async () => {
      await expectTypeNotRelated(
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
      await expectTypeRelated({ source: "int16", target: "int16" });
    });

    it("can assign numeric literal between -32768 and 32767", async () => {
      await expectTypeRelated({ source: "-31489", target: "int16" });
    });

    it("emit diagnostic when numeric literal is out of range large", async () => {
      await expectTypeNotRelated(
        { source: `34000`, target: "int16" },
        {
          code: "unassignable",
          message: "Type '34000' is not assignable to type 'Cadl.int16'",
        }
      );
    });

    it("emit diagnostic assigning decimal", async () => {
      await expectTypeNotRelated(
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
      await expectTypeRelated({ source: "int32", target: "int32" });
    });

    it("can assign numeric literal between -2147483648 and 2147483647", async () => {
      await expectTypeRelated({ source: "-2147483448", target: "int32" });
    });

    it("emit diagnostic when numeric literal is out of range large", async () => {
      await expectTypeNotRelated(
        { source: `3000000000`, target: "int32" },
        {
          code: "unassignable",
          message: "Type '3000000000' is not assignable to type 'Cadl.int32'",
        }
      );
    });

    it("emit diagnostic assigning decimal", async () => {
      await expectTypeNotRelated(
        { source: `125125125.49`, target: "int32" },
        {
          code: "unassignable",
          message: "Type '125125125.49' is not assignable to type 'Cadl.int32'",
        }
      );
    });
  });

  // Need to handle bigint in cadl.
  describe.skip("int64 target", () => {
    it("can assign int64", async () => {
      await expectTypeRelated({ source: "int64", target: "int64" });
    });

    it("can assign numeric literal between -9223372036854775807 and 9223372036854775808", async () => {
      await expectTypeRelated({ source: "-9223372036854775807", target: "int64" });
      await expectTypeRelated({ source: "9223372036854775808", target: "int64" });
    });

    it("emit diagnostic when numeric literal is out of range large", async () => {
      await expectTypeNotRelated(
        { source: `109223372036854775808`, target: "int64" },
        {
          code: "unassignable",
          message: "Type '109223372036854775808' is not assignable to type 'Cadl.int64'",
        }
      );
    });

    it("emit diagnostic assigning decimal", async () => {
      await expectTypeNotRelated(
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
        await expectTypeRelated({ source: x, target: "integer" });
      });
    });

    it("can assign numeric literal between -2147483648 and 2147483647", async () => {
      await expectTypeRelated({ source: "123", target: "integer" });
      await expectTypeRelated({ source: "34000", target: "integer" });
      await expectTypeRelated({ source: "-2147483448", target: "integer" });
    });

    it("emit diagnostic assigning decimal", async () => {
      await expectTypeNotRelated(
        { source: `125125125.49`, target: "integer" },
        {
          code: "unassignable",
          message: "Type '125125125.49' is not assignable to type 'Cadl.integer'",
        }
      );
    });
  });

  describe("real target", () => {
    ["real", "float32", "float64"].forEach((x) => {
      it(`can assign ${x}`, async () => {
        await expectTypeRelated({ source: x, target: "real" });
      });
    });

    it("can assign decimal literal", async () => {
      await expectTypeRelated({ source: "12.43", target: "real" });
      await expectTypeRelated({ source: "34000.43", target: "real" });
      await expectTypeRelated({ source: "-2147483448.43", target: "real" });
    });

    it("emit diagnostic assigning other type", async () => {
      await expectTypeNotRelated(
        { source: `boolean`, target: "real" },
        {
          code: "unassignable",
          message: "Type 'Cadl.boolean' is not assignable to type 'Cadl.real'",
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
      "real",
      "float32",
      "float64",
    ].forEach((x) => {
      it(`can assign ${x}`, async () => {
        await expectTypeRelated({ source: x, target: "numeric" });
      });
    });

    it("can assign numeric literal between -2147483648 and 2147483647", async () => {
      await expectTypeRelated({ source: "123", target: "numeric" });
      await expectTypeRelated({ source: "123.43", target: "numeric" });
      await expectTypeRelated({ source: "34000", target: "numeric" });
      await expectTypeRelated({ source: "34000.43", target: "numeric" });
      await expectTypeRelated({ source: "-2147483448", target: "numeric" });
      await expectTypeRelated({ source: "-2147483448.43", target: "numeric" });
    });

    it("emit diagnostic assigning other type", async () => {
      await expectTypeNotRelated(
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
        await expectTypeRelated({ source: x, target: "object" });
      });
    });

    it("can assign empty object", async () => {
      await expectTypeRelated({ source: "{}", target: "object" });
    });

    it("can assign object with proprety", async () => {
      await expectTypeRelated({ source: "{foo: string}", target: "object" });
    });

    it("emit diagnostic assigning other type", async () => {
      await expectTypeNotRelated(
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
        await expectTypeRelated({ source: x, target: "Record<string>" });
      });
    });

    it("can assign empty object", async () => {
      await expectTypeRelated({ source: "{}", target: "Record<string>" });
    });

    it("can assign object with property being the same type", async () => {
      await expectTypeRelated({ source: "{foo: string}", target: "Record<string>" });
      await expectTypeRelated({ source: "{foo: string, bar: string}", target: "Record<string>" });
    });

    it("can assign object with property being the of subtype type", async () => {
      await expectTypeRelated({ source: "{foo: int32}", target: "Record<numeric>" });
      await expectTypeRelated({ source: "{foo: real, bar: int64}", target: "Record<numeric>" });
    });

    it("can assign a record of subtypes", async () => {
      await expectTypeRelated({ source: "Record<int32>", target: "Record<numeric>" });
    });

    it("can assign object with extends where all properties are string", async () => {
      await expectTypeRelated({
        source: "Foo",
        target: "Record<string>",
        commonCode: `
        model Foo extends Bar  {
          prop1: string;
          prop2: string;
        }

        model Bar {
          prop3: string;
          prop4: string;
        }
      `,
      });
    });

    it("emit diagnostic assigning other type", async () => {
      await expectTypeNotRelated(
        { source: `string`, target: "Record<string>" },
        {
          code: "unassignable",
          message: "Type 'Cadl.string' is not assignable to type 'Cadl.Record<Cadl.string>'",
        }
      );
    });

    it("emit diagnostic if some properties are different type", async () => {
      await expectTypeNotRelated(
        { source: `{foo: string, bar: int32}`, target: "Record<string>" },
        {
          code: "unassignable",
          message: "Type 'Cadl.int32' is not assignable to type 'Cadl.string'",
        }
      );
    });

    it("emit diagnostic if some properties are different type in base model", async () => {
      await expectTypeNotRelated(
        {
          source: "Foo",
          target: "Record<string>",
          commonCode: `
            model Foo extends Bar {
              prop1: string;
              prop2: string;
            }

            model Bar {
              prop3: string;
              prop4: int32;
            }
            `,
        },
        {
          code: "unassignable",
          message: "Type 'Cadl.int32' is not assignable to type 'Cadl.string'",
        }
      );
    });
  });

  describe("models", () => {
    it("can assign empty object", async () => {
      await expectTypeRelated({ source: "{}", target: "{}" });
    });
    it("can assign object with the same property", async () => {
      await expectTypeRelated({ source: "{name: string}", target: "{name: string}" });
    });

    it("can assign object with the same properties", async () => {
      await expectTypeRelated({
        source: "{name: string, age: int32}",
        target: "{name: string, age: int32}",
      });
    });

    it("can assign object with extra properties", async () => {
      await expectTypeRelated({
        source: "{name: string, age: int32}",
        target: "{name: string}",
      });
    });

    it("can assign object with properties defined via inheritance", async () => {
      await expectTypeRelated({
        source: "Cat",
        target: "Aging",
        commonCode: `
          model Pet { name: string; age: int32 }
          model Cat extends Pet { moew: boolean }

          model Aging { age: int32 }
        `,
      });
    });
  });

  describe("Array target", () => {
    it("can assign the same array type", async () => {
      await expectTypeRelated({ source: "string[]", target: "string[]" });
    });

    it("can assign a record of subtypes", async () => {
      await expectTypeRelated({ source: "int32[]", target: "numeric[]" });
    });

    it("can assign a tuple of the same type", async () => {
      await expectTypeRelated({ source: "[int32, int32]", target: "int32[]" });
    });

    it("can assign a tuple of subtype", async () => {
      await expectTypeRelated({ source: "[int32, int32, int32]", target: "numeric[]" });
    });

    it("emit diagnostic assigning other type", async () => {
      await expectTypeNotRelated(
        { source: `string`, target: "string[]" },
        {
          code: "unassignable",
          message: "Type 'Cadl.string' is not assignable to type 'Cadl.string[]'",
        }
      );
    });
  });

  describe("Tuple target", () => {
    it("can assign the same tuple type", async () => {
      await expectTypeRelated({ source: "[string, string]", target: "[string, string]" });
    });

    it("can assign a tuple of subtypes", async () => {
      await expectTypeRelated({ source: "[int32, int32]", target: "[numeric, numeric]" });
    });

    it("can assign a tuple of different subtypes", async () => {
      await expectTypeRelated({
        source: "[int64, int32, uint8]",
        target: "[numeric, numeric, numeric]",
      });
    });

    it("emit diagnostic when assigning tuple of different length", async () => {
      await expectTypeNotRelated(
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
      await expectTypeRelated({ source: "string", target: "string | int32" });
    });

    it("can a subtype of any of the options", async () => {
      await expectTypeRelated({ source: "int32", target: "string | numeric | object" });
    });

    it("emit diagnostic when assigning tuple of different length", async () => {
      await expectTypeNotRelated(
        { source: `true`, target: "string | int32" },
        {
          code: "unassignable",
          message: "Type 'true' is not assignable to type 'Cadl.string | Cadl.int32'",
        }
      );
    });
  });
});
