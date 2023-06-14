import { RuleTester, createRuleTester, createTestRunner } from "@typespec/compiler/testing";
import { casingRule } from "../../src/rules/casing.rule.js";

describe("casing rule", () => {
  let ruleTester: RuleTester;

  beforeEach(async () => {
    const runner = await createTestRunner();
    ruleTester = createRuleTester(runner, casingRule, "@typespec/my-linter");
  });

  it("emit diagnostics when using model named foo", () => {
    ruleTester.expect(`model Foo {}`).toEmitDiagnostics({
      code: "@typespec/my-linter:no-foo-model",
      message: "Cannot name a model with 'Foo'",
    });
  });

  it("should be valid to use other names", () => {
    ruleTester.expect(`model Bar {}`).toBeValid();
  });
});
