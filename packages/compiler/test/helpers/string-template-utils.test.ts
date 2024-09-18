import { strictEqual } from "assert";
import { describe, it } from "vitest";
import { ModelProperty, stringTemplateToString } from "../../src/index.js";
import { expectDiagnosticEmpty } from "../../src/testing/expect.js";
import { createTestRunner } from "../../src/testing/test-host.js";

describe("compiler: stringTemplateToString (deprecated)", () => {
  async function stringifyTemplate(template: string) {
    const runner = await createTestRunner();
    const { value } = (await runner.compile(`model Foo { @test value: ${template}; }`)) as {
      value: ModelProperty;
    };

    strictEqual(value.type.kind, "StringTemplate");
    return stringTemplateToString(value.type);
  }

  async function expectTemplateToString(template: string, expectation: string) {
    const [result, diagnostics] = await stringifyTemplate(template);
    expectDiagnosticEmpty(diagnostics);
    strictEqual(result, expectation);
  }

  describe("interpolate types", () => {
    it("string literal", async () => {
      await expectTemplateToString('"Start ${"one"} end"', "Start one end");
    });

    it("numeric literal", async () => {
      await expectTemplateToString('"Start ${123} end"', "Start 123 end");
    });

    it("boolean literal", async () => {
      await expectTemplateToString('"Start ${true} end"', "Start true end");
    });

    it("nested string template", async () => {
      await expectTemplateToString(
        '"Start ${"Nested-start ${"one"} nested-end"} end"',
        "Start Nested-start one nested-end end",
      );
    });
  });

  it("stringify template with multiple spans", async () => {
    await expectTemplateToString(
      '"Start ${"one"} middle ${"two"} end"',
      "Start one middle two end",
    );
  });
});
