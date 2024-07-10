import { describe, expect, it } from "vitest";
import { resolveTemplateInstanceName } from "../../../src/core/helpers/naming-utils.js";
import type { Diagnostic, Model } from "../../../src/index.js";
import { expectDiagnosticEmpty, expectDiagnostics } from "../../../src/testing/expect.js";
import { createTestRunner } from "../../../src/testing/test-host.js";

describe("resolveTemplateInstanceName()", () => {
  async function computeNameWithDiagnostics(
    code: string,
    ref: string
  ): Promise<[string | undefined, readonly Diagnostic[]]> {
    const runner = await createTestRunner();
    const { Test } = (await runner.compile(`
        ${code}
  
      @test model Test {
       prop: ${ref}
      }
    `)) as { Test: Model };

    return resolveTemplateInstanceName(runner.program, Test.properties.get("prop")?.type as any);
  }

  async function computeName(code: string, ref: string): Promise<string | undefined> {
    const [name, diagnostics] = await computeNameWithDiagnostics(code, ref);

    expectDiagnosticEmpty(diagnostics);
    return name;
  }
  async function diagnoseName(code: string, ref: string): Promise<readonly Diagnostic[]> {
    const [_, diagnostics] = await computeNameWithDiagnostics(code, ref);

    return diagnostics;
  }

  describe("prefix capitalized template argument name in front of template name", () => {
    it.each([
      ["Foo<string>", "StringFoo"],
      ["Foo<Bar>", "BarFoo"],
    ])("%s -> %s", async (ref, expected) => {
      const name = await computeName(
        `
        model Foo<T> {}
        model Bar {}
      `,
        ref
      );

      expect(name).toEqual(expected);
    });
  });

  it("prefix multiple argument in order", async () => {
    expect(await computeName(`model Foo<A, B, C> {}`, "Foo<string, int32, int8>")).toEqual(
      "StringInt32Int8Foo"
    );
  });

  it("recursively resolved template instance passed as arguments", async () => {
    const code = `
      model Foo<T> {}
      model Bar<T> {}`;
    expect(await computeName(code, "Foo<Bar<string>>")).toEqual("StringBarFoo");
  });

  it("report diagnostic if argument is not nameable", async () => {
    expectDiagnostics(await diagnoseName("model Foo<T> {}", "Foo<123>"), {
      code: "template-instance-unnameable",
      message: "Cannot resolve a name for template 'Foo'. Argument '123' doesn't have a name.",
    });
  });
});
