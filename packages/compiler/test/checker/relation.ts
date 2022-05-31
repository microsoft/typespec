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

describe.only("compiler: checker: intrinsic", () => {
  let runner: BasicTestRunner;

  beforeEach(async () => {
    runner = createTestWrapper(await createTestHost(), (x) => x);
  });

  async function checkTypeRelated(source: string, target: string) {
    const { Test } = (await runner.compile(`@test model Test {
      source: ${source};
      target: ${target};
    }`)) as { Test: ModelType };
    const sourceProp = Test.properties.get("source")!.type;
    const targetProp = Test.properties.get("target")!.type;
    return runner.program.checker.isTypeRelatedTo(sourceProp, targetProp);
  }

  async function expectTypeRelated(source: string, target: string) {
    const [related, diagnostics] = await checkTypeRelated(source, target);
    expectDiagnosticEmpty(diagnostics);
    ok(related, `Type ${source} should be assignable to ${target}`);
  }

  async function expectTypeNotRelated(
    source: string,
    target: string,
    match: DiagnosticMatch | DiagnosticMatch[]
  ) {
    const [related, diagnostics] = await checkTypeRelated(source, target);
    ok(!related, `Type ${source} should NOT be assignable to ${target}`);
    expectDiagnostics(diagnostics, match);
  }

  describe("string target", () => {
    it("can assign string", async () => {
      await expectTypeRelated("string", "string");
    });

    it("can assign string literal", async () => {
      await expectTypeRelated(`"foo"`, "string");
    });

    it("can assign string literal", async () => {
      await expectTypeNotRelated("123", "string", {
        code: "unassignable",
        message: "Type '123' is not assignable to type 'Cadl.string'",
      });
    });
  });

  describe("string literal target", () => {
    it("can the exact same literal", async () => {
      await expectTypeRelated(`"foo"`, `"foo"`);
    });

    it("emit diagnostic when passing other literal", async () => {
      await expectTypeNotRelated(`"bar"`, `"foo"`, {
        code: "unassignable",
        message: "Type 'bar' is not assignable to type 'foo'",
      });
    });

    it("emit diagnostic when passing string type", async () => {
      await expectTypeNotRelated(`string`, `"foo"`, {
        code: "unassignable",
        message: "Type 'Cadl.string' is not assignable to type 'foo'",
      });
    });
  });

  describe("int8 target", () => {
    it("can assign int8", async () => {
      await expectTypeRelated("int8", "int8");
    });

    it("can assign numeric literal between -128 and 127", async () => {
      await expectTypeRelated("123", "int8");
    });

    it("emit diagnostic when numeric literal is out of range large", async () => {
      await expectTypeNotRelated(`129`, "int8", {
        code: "unassignable",
        message: "Type '129' is not assignable to type 'Cadl.int8'",
      });
    });
    it("emit diagnostic assigning decimal", async () => {
      await expectTypeNotRelated(`21.49`, "int8", {
        code: "unassignable",
        message: "Type '21.49' is not assignable to type 'Cadl.int8'",
      });
    });
  });

  describe("int16 target", () => {
    it("can assign int8", async () => {
      await expectTypeRelated("int16", "int16");
    });

    it("can assign numeric literal between -32768 and 32767", async () => {
      await expectTypeRelated("-31489", "int16");
    });

    it("emit diagnostic when numeric literal is out of range large", async () => {
      await expectTypeNotRelated(`34000`, "int16", {
        code: "unassignable",
        message: "Type '34000' is not assignable to type 'Cadl.int16'",
      });
    });

    it("emit diagnostic assigning decimal", async () => {
      await expectTypeNotRelated(`31489.49`, "int16", {
        code: "unassignable",
        message: "Type '31489.49' is not assignable to type 'Cadl.int16'",
      });
    });
  });

  describe("int32 target", () => {
    it("can assign int32", async () => {
      await expectTypeRelated("int32", "int32");
    });

    it("can assign numeric literal between -2147483648 and 2147483647", async () => {
      await expectTypeRelated("-2147483448", "int32");
    });

    it("emit diagnostic when numeric literal is out of range large", async () => {
      await expectTypeNotRelated(`3000000000`, "int32", {
        code: "unassignable",
        message: "Type '3000000000' is not assignable to type 'Cadl.int32'",
      });
    });

    it("emit diagnostic assigning decimal", async () => {
      await expectTypeNotRelated(`125125125.49`, "int32", {
        code: "unassignable",
        message: "Type '125125125.49' is not assignable to type 'Cadl.int32'",
      });
    });
  });

  // Need to handle bigint in cadl.
  describe.skip("int64 target", () => {
    it("can assign int64", async () => {
      await expectTypeRelated("int64", "int64");
    });

    it("can assign numeric literal between -9223372036854775807 and 9223372036854775808", async () => {
      await expectTypeRelated("-9223372036854775807", "int64");
      await expectTypeRelated("9223372036854775808", "int64");
    });

    it("emit diagnostic when numeric literal is out of range large", async () => {
      await expectTypeNotRelated(`109223372036854775808`, "int64", {
        code: "unassignable",
        message: "Type '109223372036854775808' is not assignable to type 'Cadl.int64'",
      });
    });

    it("emit diagnostic assigning decimal", async () => {
      await expectTypeNotRelated(`9223372036875808.49`, "int64", {
        code: "unassignable",
        message: "Type '9223372036875808.49' is not assignable to type 'Cadl.int64'",
      });
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
        await expectTypeRelated(x, "integer");
      });
    });

    it("can assign numeric literal between -2147483648 and 2147483647", async () => {
      await expectTypeRelated("123", "integer");
      await expectTypeRelated("34000", "integer");
      await expectTypeRelated("-2147483448", "integer");
    });

    it("emit diagnostic assigning decimal", async () => {
      await expectTypeNotRelated(`125125125.49`, "integer", {
        code: "unassignable",
        message: "Type '125125125.49' is not assignable to type 'Cadl.integer'",
      });
    });
  });

  describe("real target", () => {
    ["real", "float32", "float64"].forEach((x) => {
      it(`can assign ${x}`, async () => {
        await expectTypeRelated(x, "real");
      });
    });

    it("can assign decimal literal", async () => {
      await expectTypeRelated("12.43", "real");
      await expectTypeRelated("34000.43", "real");
      await expectTypeRelated("-2147483448.43", "real");
    });

    it("emit diagnostic assigning other type", async () => {
      await expectTypeNotRelated(`boolean`, "real", {
        code: "unassignable",
        message: "Type 'Cadl.boolean' is not assignable to type 'Cadl.real'",
      });
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
        await expectTypeRelated(x, "numeric");
      });
    });

    it("can assign numeric literal between -2147483648 and 2147483647", async () => {
      await expectTypeRelated("123", "numeric");
      await expectTypeRelated("123.43", "numeric");
      await expectTypeRelated("34000", "numeric");
      await expectTypeRelated("34000.43", "numeric");
      await expectTypeRelated("-2147483448", "numeric");
      await expectTypeRelated("-2147483448.43", "numeric");
    });

    it("emit diagnostic assigning other type", async () => {
      await expectTypeNotRelated(`string`, "numeric", {
        code: "unassignable",
        message: "Type 'Cadl.string' is not assignable to type 'Cadl.numeric'",
      });
    });
  });
});
