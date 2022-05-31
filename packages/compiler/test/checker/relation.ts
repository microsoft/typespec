import { ok } from "assert";
import { ModelType } from "../../core/index.js";
import { BasicTestRunner, createTestHost, createTestWrapper } from "../../testing/index.js";

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
    const related = await checkTypeRelated(source, target);
    ok(related, `Type ${source} should be assignable to ${target}`);
  }
  async function expectTypeNotRelated(source: string, target: string) {
    const related = await checkTypeRelated(source, target);
    ok(!related, `Type ${source} should NOT be assignable to ${target}`);
  }

  describe("string target", () => {
    it("can assign string", async () => {
      await expectTypeRelated("string", "string");
    });

    it("can assign string literal", async () => {
      await expectTypeRelated(`"foo"`, "string");
    });

    it("can assign string literal", async () => {
      await expectTypeNotRelated("123", "string");
    });
  });

  describe("string literal target", () => {
    it("can the exact same literal", async () => {
      await expectTypeRelated(`"foo"`, `"foo"`);
    });

    it("emit diagnostic when passing other literal", async () => {
      await expectTypeNotRelated(`"bar"`, `"foo"`);
    });

    it("emit diagnostic when passing string type", async () => {
      await expectTypeNotRelated(`string`, `"foo"`);
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
      await expectTypeNotRelated(`129`, "int8");
    });
  });
});
