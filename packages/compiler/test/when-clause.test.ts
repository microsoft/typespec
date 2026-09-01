import { describe, expect, it } from "vitest";
import { hasParseError, parse } from "../src/core/parser.js";
import type {
  DecoratorExpressionNode,
  ModelPropertyNode,
  ModelStatementNode,
  TypeSpecScriptNode,
} from "../src/core/types.js";
import { SyntaxKind } from "../src/core/types.js";

function parseOk(code: string): TypeSpecScriptNode {
  const script = parse(code);
  expect(
    script.parseDiagnostics.map((d) => `${d.code}: ${d.message}`),
    "expected no parse diagnostics",
  ).toEqual([]);
  expect(hasParseError(script), "expected no parse errors").toBeFalsy();
  return script;
}

function firstModel(script: TypeSpecScriptNode): ModelStatementNode {
  const stmt = script.statements[0];
  expect(stmt.kind).toBe(SyntaxKind.ModelStatement);
  return stmt as ModelStatementNode;
}

function decoratorsOf(code: string): readonly DecoratorExpressionNode[] {
  return firstModel(parseOk(code)).decorators;
}

describe("when clause on decorators: parsing", () => {
  it("parses a single condition", () => {
    const [dec] = decoratorsOf(`@name("Cs") when emitter("csharp") model Foo {}`);
    expect(dec.when).toBeDefined();
    expect(dec.when!.kind).toBe(SyntaxKind.WhenClause);
    expect(dec.when!.conditions).toHaveLength(1);
    expect(dec.when!.conditions[0].kind).toBe(SyntaxKind.CallExpression);
  });

  it("parses a member expression condition", () => {
    const [dec] = decoratorsOf(`@name("R") when Lifecycle.read model Foo {}`);
    expect(dec.when!.conditions).toHaveLength(1);
    expect(dec.when!.conditions[0].kind).toBe(SyntaxKind.MemberExpression);
  });

  it("parses a bare identifier condition", () => {
    const [dec] = decoratorsOf(`@name("R") when Everywhere model Foo {}`);
    expect(dec.when!.conditions[0].kind).toBe(SyntaxKind.Identifier);
  });

  it("parses alternatives separated by `|`", () => {
    const [dec] = decoratorsOf(
      `@name("Cs") when emitter("csharp") | emitter("java") | Lifecycle.read model Foo {}`,
    );
    expect(dec.when!.conditions).toHaveLength(3);
    expect(dec.when!.conditions.map((c) => c.kind)).toEqual([
      SyntaxKind.CallExpression,
      SyntaxKind.CallExpression,
      SyntaxKind.MemberExpression,
    ]);
  });

  it("leaves `when` undefined on an unconditioned decorator", () => {
    const [dec] = decoratorsOf(`@name("Bar") model Foo {}`);
    expect(dec.when).toBeUndefined();
  });

  it("attaches the clause to the preceding decorator only", () => {
    const decs = decoratorsOf(`@doc("d") @name("Cs") when emitter("csharp") model Foo {}`);
    expect(decs).toHaveLength(2);
    expect(decs[0].when).toBeUndefined();
    expect(decs[1].when).toBeDefined();
  });

  it("allows a following decorator after a when clause", () => {
    const decs = decoratorsOf(`@name("Cs") when emitter("csharp") @doc("d") model Foo {}`);
    expect(decs).toHaveLength(2);
    expect(decs[0].when).toBeDefined();
    expect(decs[1].when).toBeUndefined();
  });

  it("allows each decorator in a list to carry its own clause", () => {
    const decs = decoratorsOf(
      `@name("Cs") when emitter("csharp")\n@name("Py") when emitter("python")\nmodel Foo {}`,
    );
    expect(decs).toHaveLength(2);
    expect(decs[0].when).toBeDefined();
    expect(decs[1].when).toBeDefined();
  });

  it("supports a decorator with no arguments", () => {
    const [dec] = decoratorsOf(`@internal when emitter("csharp") model Foo {}`);
    expect(dec.when!.conditions).toHaveLength(1);
  });

  it("parses on a model property, terminated by the property name", () => {
    const model = firstModel(
      parseOk(`model Foo {\n  @name("Cs") when emitter("csharp")\n  prop: string;\n}`),
    );
    const prop = model.properties[0] as ModelPropertyNode;
    expect(prop.kind).toBe(SyntaxKind.ModelProperty);
    expect(prop.id.sv).toBe("prop");
    expect(prop.decorators[0].when).toBeDefined();
  });

  it("parses on a model property with a member-expression condition", () => {
    const model = firstModel(
      parseOk(`model Foo {\n  @name("R") when Lifecycle.read\n  prop: string;\n}`),
    );
    const prop = model.properties[0] as ModelPropertyNode;
    expect(prop.id.sv).toBe("prop");
    expect(prop.decorators[0].when!.conditions[0].kind).toBe(SyntaxKind.MemberExpression);
  });

  it("parses on an operation parameter", () => {
    const script = parseOk(`op foo(@name("Cs") when emitter("csharp") p: string): void;`);
    expect(script.statements[0].kind).toBe(SyntaxKind.OperationStatement);
  });

  it("parses on an augment decorator statement", () => {
    const script = parseOk(`@@name(Foo, "Cs") when emitter("csharp");`);
    const stmt = script.statements[0];
    expect(stmt.kind).toBe(SyntaxKind.AugmentDecoratorStatement);
    expect((stmt as any).when).toBeDefined();
  });

  it("is visited by visitChildren (no orphaned nodes)", () => {
    // parseOk asserts hasParseError() agrees with parseDiagnostics, which walks
    // children — an unvisited node would put those two out of sync.
    parseOk(`@name("Cs") when emitter("csharp") | Lifecycle.read model Foo {}`);
  });
});

describe("when clause on decorators: `when` as a keyword", () => {
  it("rejects `when` as a declaration name", () => {
    const script = parse(`model when {}`);
    expect(script.parseDiagnostics.length).toBeGreaterThan(0);
  });

  it("still allows `when` as a model property name", () => {
    // Property names accept keywords, matching how other keywords behave.
    parseOk(`model Foo { when: string; }`);
  });

  it("still allows `when` as an enum member name", () => {
    parseOk(`enum Foo { when }`);
  });
});

describe("when clause on decorators: rejected syntax", () => {
  function parseError(code: string) {
    const script = parse(code);
    expect(
      script.parseDiagnostics.length,
      `expected parse diagnostics for ${JSON.stringify(code)}`,
    ).toBeGreaterThan(0);
    return script.parseDiagnostics;
  }

  it("rejects comma-separated condition lists", () => {
    // `,` is the model-property and op-parameter separator; a comma list is ambiguous.
    parseError(`model Foo {\n  @name("a") when emitter("x"), emitter("y")\n  prop: string;\n}`);
  });

  it("rejects an empty condition", () => {
    parseError(`@name("a") when model Foo {}`);
  });

  it("rejects a dangling `|`", () => {
    parseError(`@name("a") when emitter("x") | model Foo {}`);
  });

  it("rejects a string literal as a condition", () => {
    parseError(`@name("a") when "csharp" model Foo {}`);
  });

  it("rejects a trailing when clause on a statement", () => {
    // Deliberately unsupported: see the syntax spike — the trailing form makes
    // `model Foo {} when c` vs `model Foo {} when c { ... }` silently different.
    parseError(`model Foo {} when emitter("x")`);
  });
});
