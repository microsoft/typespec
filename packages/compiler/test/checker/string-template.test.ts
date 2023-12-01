import { strictEqual } from "assert";
import { Model, StringTemplate } from "../../src/index.js";
import { BasicTestRunner, createTestRunner } from "../../src/testing/index.js";

describe("compiler: string templates", () => {
  let runner: BasicTestRunner;

  beforeEach(async () => {
    runner = await createTestRunner();
  });

  async function compileStringTemplate(
    templateString: string,
    other?: string
  ): Promise<StringTemplate> {
    const { Test } = (await runner.compile(
      `
      @test model Test {
        test: ${templateString};
      }

      ${other ?? ""}
      `
    )) as { Test: Model };

    const prop = Test.properties.get("test")!.type;

    strictEqual(prop.kind, "StringTemplate");
    return prop;
  }

  it("simple", async () => {
    const template = await compileStringTemplate(`"Start \${123} end"`);
    strictEqual(template.spans.length, 3);
    strictEqual(template.spans[0].isInterpolated, false);
    strictEqual(template.spans[0].type.value, "Start ");

    strictEqual(template.spans[1].isInterpolated, true);
    strictEqual(template.spans[1].type.kind, "Number");
    strictEqual(template.spans[1].type.value, 123);

    strictEqual(template.spans[2].isInterpolated, false);
    strictEqual(template.spans[2].type.value, " end");
  });

  it("string interpolated are marked with isInterpolated", async () => {
    const template = await compileStringTemplate(`"Start \${"interpolate"} end"`);
    strictEqual(template.spans.length, 3);
    strictEqual(template.spans[0].isInterpolated, false);
    strictEqual(template.spans[0].type.value, "Start ");

    strictEqual(template.spans[1].isInterpolated, true);
    strictEqual(template.spans[1].type.kind, "String");
    strictEqual(template.spans[1].type.value, "interpolate");

    strictEqual(template.spans[2].isInterpolated, false);
    strictEqual(template.spans[2].type.value, " end");
  });

  it("can interpolate a model", async () => {
    const template = await compileStringTemplate(`"Start \${TestModel} end"`, "model TestModel {}");
    strictEqual(template.spans.length, 3);
    strictEqual(template.spans[0].isInterpolated, false);
    strictEqual(template.spans[0].type.value, "Start ");

    strictEqual(template.spans[1].isInterpolated, true);
    strictEqual(template.spans[1].type.kind, "Model");
    strictEqual(template.spans[1].type.name, "TestModel");

    strictEqual(template.spans[2].isInterpolated, false);
    strictEqual(template.spans[2].type.value, " end");
  });
});
