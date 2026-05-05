import { deepStrictEqual, ok, strictEqual } from "assert";
import { describe, it } from "vitest";
import { parse, hasParseError } from "../src/core/parser.js";
import {
  DecoratorExpressionNode,
  ModelPropertyNode,
  ModelStatementNode,
  SyntaxKind,
  WhenClauseNode,
} from "../src/core/types.js";

describe("compiler: when clause", () => {
  describe("decorator with when clause", () => {
    it("parses single condition on decorator", () => {
      const ast = parseSuccessfully(
        `@name("CsBar") when emitter("@typespec/http-client-csharp") model Bar {}`,
      );
      const model = ast.statements[0] as ModelStatementNode;
      strictEqual(model.kind, SyntaxKind.ModelStatement);
      strictEqual(model.decorators.length, 1);

      const dec = model.decorators[0];
      ok(dec.when, "decorator should have a when clause");
      strictEqual(dec.when.kind, SyntaxKind.WhenClause);
      strictEqual(dec.when.conditions.length, 1);

      const cond = dec.when.conditions[0];
      strictEqual(cond.kind, SyntaxKind.WhenExpression);
      strictEqual(cond.target.kind, SyntaxKind.Identifier);
      if (cond.target.kind === SyntaxKind.Identifier) {
        strictEqual(cond.target.sv, "emitter");
      }
      strictEqual(cond.arguments.length, 1);
    });

    it("parses multiple conditions on decorator (AND semantics)", () => {
      const ast = parseSuccessfully(
        `@name("Foo") when emitter("csharp"), target("client") model Bar {}`,
      );
      const model = ast.statements[0] as ModelStatementNode;
      const dec = model.decorators[0];
      ok(dec.when);
      strictEqual(dec.when.conditions.length, 2);
      strictEqual(dec.when.conditions[0].kind, SyntaxKind.WhenExpression);
      strictEqual(dec.when.conditions[1].kind, SyntaxKind.WhenExpression);
    });

    it("parses enum member reference as condition", () => {
      const ast = parseSuccessfully(`@visibility when Lifecycle.read model Foo {}`);
      const model = ast.statements[0] as ModelStatementNode;
      const dec = model.decorators[0];
      ok(dec.when);
      strictEqual(dec.when.conditions.length, 1);
      const cond = dec.when.conditions[0];
      // Enum member ref has no arguments
      strictEqual(cond.arguments.length, 0);
      // Target is a member expression
      strictEqual(cond.target.kind, SyntaxKind.MemberExpression);
    });

    it("decorator without when clause still works", () => {
      const ast = parseSuccessfully(`@name("Foo") model Bar {}`);
      const model = ast.statements[0] as ModelStatementNode;
      const dec = model.decorators[0];
      strictEqual(dec.when, undefined);
    });
  });

  describe("model property with when clause", () => {
    it("parses property with when clause", () => {
      const ast = parseSuccessfully(`model Foo { name: string when Lifecycle.read; }`);
      const model = ast.statements[0] as ModelStatementNode;
      const prop = model.properties[0] as ModelPropertyNode;
      ok(prop.when, "property should have a when clause");
      strictEqual(prop.when.conditions.length, 1);
      strictEqual(prop.when.conditions[0].target.kind, SyntaxKind.MemberExpression);
    });

    it("parses property with filter call condition", () => {
      const ast = parseSuccessfully(`model Foo { id: string when since(Versions.v2); }`);
      const model = ast.statements[0] as ModelStatementNode;
      const prop = model.properties[0] as ModelPropertyNode;
      ok(prop.when);
      strictEqual(prop.when.conditions.length, 1);
      const cond = prop.when.conditions[0];
      if (cond.target.kind === SyntaxKind.Identifier) {
        strictEqual(cond.target.sv, "since");
      }
      strictEqual(cond.arguments.length, 1);
    });

    it("property without when clause still works", () => {
      const ast = parseSuccessfully(`model Foo { name: string; }`);
      const model = ast.statements[0] as ModelStatementNode;
      const prop = model.properties[0] as ModelPropertyNode;
      strictEqual(prop.when, undefined);
    });
  });

  describe("model statement with when clause", () => {
    it("parses model with trailing when clause", () => {
      const ast = parseSuccessfully(`model Foo {} when since(Version.v2)`);
      const model = ast.statements[0] as ModelStatementNode;
      ok(model.when, "model should have a when clause");
      strictEqual(model.when.conditions.length, 1);
    });

    it("parses model with between condition", () => {
      const ast = parseSuccessfully(`model Foo {} when between(Versions.v2, Versions.v3)`);
      const model = ast.statements[0] as ModelStatementNode;
      ok(model.when);
      const cond = model.when.conditions[0];
      if (cond.target.kind === SyntaxKind.Identifier) {
        strictEqual(cond.target.sv, "between");
      }
      strictEqual(cond.arguments.length, 2);
    });
  });

  describe("when used as identifier (backward compatibility)", () => {
    it("allows 'when' as a model property name", () => {
      const ast = parseSuccessfully(`model Foo { when: string; }`);
      const model = ast.statements[0] as ModelStatementNode;
      const prop = model.properties[0] as ModelPropertyNode;
      strictEqual(prop.id.sv, "when");
      strictEqual(prop.when, undefined);
    });
  });
});

function parseSuccessfully(code: string) {
  const ast = parse(code);
  if (hasParseError(ast)) {
    const errors = ast.parseDiagnostics.map((d) => d.message).join("\n");
    throw new Error(`Unexpected parse errors:\n${errors}`);
  }
  return ast;
}
