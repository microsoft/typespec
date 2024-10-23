import { strictEqual } from "assert";
import { beforeEach, describe, it } from "vitest";
import { Model, StringTemplate } from "../../src/index.js";
import {
  BasicTestRunner,
  createTestRunner,
  expectDiagnostics,
  extractSquiggles,
} from "../../src/testing/index.js";

let runner: BasicTestRunner;

beforeEach(async () => {
  runner = await createTestRunner();
});

async function compileStringTemplate(
  templateString: string,
  other?: string,
): Promise<StringTemplate> {
  const { Test } = (await runner.compile(
    `
      @test model Test {
        test: ${templateString};
      }

      ${other ?? ""}
      `,
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

it("emit error if interpolating value and types", async () => {
  const diagnostics = await runner.diagnose(
    `
    const str1 = "hi";
    alias str2 = "\${str1} and \${string}";
    `,
  );
  expectDiagnostics(diagnostics, {
    code: "mixed-string-template",
    message:
      "String template is interpolating values and types. It must be either all values to produce a string value or or all types for string template type.",
  });
});

describe("emit error if interpolating value in a context where template is used as a type", () => {
  it.each([
    ["alias", `alias str2 = "with value \${str1}";`],
    ["model prop", `model Foo { a: "with value \${str1}"; }`],
  ])("%s", async (_, code) => {
    const source = `
      const str1 = "hi";
      ${code}
    `;
    const diagnostics = await runner.diagnose(source);
    expectDiagnostics(diagnostics, {
      code: "value-in-type",
      message: "A value cannot be used as a type.",
    });
  });
});

it("emit error if interpolating template parameter that can be a type or value", async () => {
  const { source, pos, end } = extractSquiggles(`
      alias Template<T extends string | (valueof string)> = {
        a: ~~~"\${T}"~~~;
      };
    `);
  const diagnostics = await runner.diagnose(source);
  expectDiagnostics(diagnostics, {
    code: "mixed-string-template",
    message:
      "String template is interpolating values and types. It must be either all values to produce a string value or or all types for string template type.",
    pos,
    end,
  });
});

it("emit error if interpolating template parameter that is a value but using template parmater as a type", async () => {
  const { source, pos, end } = extractSquiggles(`
      alias Template<T extends valueof string> = {
        a: ~~~"\${T}"~~~;
      };
    `);
  const diagnostics = await runner.diagnose(source);
  expectDiagnostics(diagnostics, {
    code: "value-in-type",
    message: "A value cannot be used as a type.",
    pos,
    end,
  });
});
