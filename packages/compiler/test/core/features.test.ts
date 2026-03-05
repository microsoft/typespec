import { beforeEach, describe, expect, it } from "vitest";
import { parse } from "../../src/core/parser.js";
import { SyntaxKind } from "../../src/core/types.js";
import {
  TestHost,
  createTestHost,
  expectDiagnosticEmpty,
  expectDiagnostics,
} from "../../src/testing/index.js";

describe("compiler: features", () => {
  describe("parser", () => {
    it("#enable parses as standalone statement", () => {
      const script = parse(`#enable "someFeature"\nmodel Foo {}`);
      expect(script.statements.length).toBe(2);
      expect(script.statements[0].kind).toBe(SyntaxKind.DirectiveExpression);
      expect(script.statements[1].kind).toBe(SyntaxKind.ModelStatement);
    });

    it("#disable parses as standalone statement", () => {
      const script = parse(`#disable "someFeature"\nmodel Foo {}`);
      expect(script.statements.length).toBe(2);
      expect(script.statements[0].kind).toBe(SyntaxKind.DirectiveExpression);
    });

    it("#enable is not attached to the following declaration", () => {
      const script = parse(`#enable "someFeature"\nmodel Foo {}`);
      const model = script.statements[1];
      expect(model.directives?.length ?? 0).toBe(0);
    });

    it("#enable alone in a file parses correctly", () => {
      const script = parse(`#enable "someFeature"`);
      expect(script.statements.length).toBe(1);
      expect(script.statements[0].kind).toBe(SyntaxKind.DirectiveExpression);
    });

    it("multiple #enable directives parse as separate statements", () => {
      const script = parse(`#enable "feat1"\n#enable "feat2"\nmodel Foo {}`);
      expect(script.statements.length).toBe(3);
      expect(script.statements[0].kind).toBe(SyntaxKind.DirectiveExpression);
      expect(script.statements[1].kind).toBe(SyntaxKind.DirectiveExpression);
      expect(script.statements[2].kind).toBe(SyntaxKind.ModelStatement);
    });

    it("#suppress still attaches to the next declaration", () => {
      const script = parse(`#suppress "code"\nmodel Foo {}`);
      expect(script.statements.length).toBe(1);
      expect(script.statements[0].kind).toBe(SyntaxKind.ModelStatement);
      expect(script.statements[0].directives?.length).toBe(1);
    });

    it("#enable and #suppress can coexist", () => {
      const script = parse(`#enable "someFeature"\n#suppress "code"\nmodel Foo {}`);
      expect(script.statements.length).toBe(2);
      // First statement is the #enable directive
      expect(script.statements[0].kind).toBe(SyntaxKind.DirectiveExpression);
      // Second statement is the model with #suppress attached
      expect(script.statements[1].kind).toBe(SyntaxKind.ModelStatement);
      expect(script.statements[1].directives?.length).toBe(1);
    });
  });

  describe("feature resolution", () => {
    let host: TestHost;

    beforeEach(async () => {
      host = await createTestHost();
    });

    it("unknown feature produces diagnostic", async () => {
      host.addTypeSpecFile("main.tsp", `#enable "nonexistent-feature"`);
      const diagnostics = await host.diagnose("main.tsp", { nostdlib: true });
      expectDiagnostics(diagnostics, { code: "unknown-feature" });
    });

    it("unknown feature in #disable produces diagnostic", async () => {
      host.addTypeSpecFile("main.tsp", `#disable "nonexistent-feature"`);
      const diagnostics = await host.diagnose("main.tsp", { nostdlib: true });
      expectDiagnostics(diagnostics, { code: "unknown-feature" });
    });

    it("compiles without errors when no features are used", async () => {
      host.addTypeSpecFile("main.tsp", `model Foo {}`);
      const diagnostics = await host.diagnose("main.tsp", { nostdlib: true });
      expectDiagnosticEmpty(diagnostics);
    });
  });
});
