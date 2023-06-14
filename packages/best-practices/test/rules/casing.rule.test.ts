import { RuleTester, createRuleTester, createTestRunner } from "@typespec/compiler/testing";
import { casingRule } from "../../src/rules/casing.rule.js";

describe("casing rule", () => {
  let ruleTester: RuleTester;

  beforeEach(async () => {
    const runner = await createTestRunner();
    ruleTester = createRuleTester(runner, casingRule, "@typespec/best-practices");
  });

  describe("models", () => {
    it("emit diagnostics if model is camelCase", () => {
      ruleTester.expect(`model fooBar {}`).toEmitDiagnostics({
        code: "@typespec/best-practices:no-foo-model",
        message: "Cannot name a model with 'Foo'",
      });
    });

    it("should be valid if model is pascal case", () => {
      ruleTester.expect(`model FooBar {}`).toBeValid();
    });
  });
});
