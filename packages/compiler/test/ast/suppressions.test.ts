import { describe, expect, it } from "vitest";
import { collectSuppressions, parse, SyntaxKind, type Suppression } from "../../src/ast/index.js";
import { createSourceFile } from "../../src/index.js";
import { expectDiagnosticEmpty } from "../../src/testing/index.js";
import { Tester } from "../tester.js";

function collect(text: string) {
  const script = parse(createSourceFile(text, "main.tsp"));
  expectDiagnosticEmpty(script.parseDiagnostics);
  return collectSuppressions(script);
}

function context(suppression: Suppression) {
  return suppression.scope.map(({ node, name }) => [SyntaxKind[node.kind], name]);
}

it("collects all suppressions without resolving codes or dependencies", () => {
  const suppressions = collect(`
    import "not-installed";
    #deprecated "old"
    #suppress "not-installed/rule" "first"
    #suppress "not-installed/rule" "first"
    #suppress deprecated
    model M {}
  `);
  expect(suppressions.map(({ directive }) => [directive.code, directive.message])).toEqual([
    ["not-installed/rule", "first"],
    ["not-installed/rule", "first"],
    ["deprecated", ""],
  ]);
  expect(new Set(suppressions.map(({ directive }) => directive.node)).size).toBe(3);
  expect(suppressions.every(({ target }) => target === suppressions[0].target)).toBe(true);
  expect(context(suppressions[0])).toEqual([["ModelStatement", "M"]]);
});

it("returns no suppressions for an empty file or other directives", () => {
  expect(collect("")).toEqual([]);
  expect(collect('#deprecated "old"\nmodel M {}')).toEqual([]);
});

it("leaves parse diagnostics available and skips directives without a code", () => {
  const script = parse("#suppress\nmodel M {}\n#suppress 123\nmodel N {}");
  expect(script.parseDiagnostics.length).toBeGreaterThan(0);
  const diagnostics = [...script.parseDiagnostics];
  expect(collectSuppressions(script)).toEqual([]);
  expect(script.parseDiagnostics).toEqual(diagnostics);
});

it("tracks a file namespace without applying it to preceding statements", () => {
  const suppressions = collect(`
    #suppress "before" "before namespace"
    using Other;
    #suppress "namespace" "namespace itself"
    namespace A.B;
    model M {
      #suppress "property" "property"
      p: string;
    }
    interface I {
      #suppress "operation" "operation"
      read(): M;
    }
  `);
  expect(suppressions.map(context)).toEqual([
    [],
    [
      ["NamespaceStatement", "A"],
      ["NamespaceStatement", "B"],
    ],
    [
      ["NamespaceStatement", "A"],
      ["NamespaceStatement", "B"],
      ["ModelStatement", "M"],
      ["ModelProperty", "p"],
    ],
    [
      ["NamespaceStatement", "A"],
      ["NamespaceStatement", "B"],
      ["InterfaceStatement", "I"],
      ["OperationStatement", "read"],
    ],
  ]);
});

it.each(["namespace A.B", "namespace A { namespace B"])(
  "normalizes namespace context: %s",
  (namespace) => {
    const suffix = namespace.includes("{") ? "}" : "";
    const [suppression] = collect(`${namespace} {
      #suppress "rule"
      model M {}
    } ${suffix}`);
    expect(context(suppression)).toEqual([
      ["NamespaceStatement", "A"],
      ["NamespaceStatement", "B"],
      ["ModelStatement", "M"],
    ]);
  },
);

it("deduplicates shared namespace directive nodes, retaining their deepest attachment", () => {
  const suppressions = collect(`
    namespace Outer {
      #suppress "rule" "first"
      #suppress "rule" "second"
      namespace A.B {}
    }
  `);
  expect(suppressions).toHaveLength(2);
  expect(suppressions.map(({ directive }) => directive.message)).toEqual(["first", "second"]);
  for (const suppression of suppressions) {
    expect(context(suppression)).toEqual([
      ["NamespaceStatement", "Outer"],
      ["NamespaceStatement", "A"],
      ["NamespaceStatement", "B"],
    ]);
    expect(suppression.target).toBe(suppression.scope[2].node);
  }
});

describe("declaration context", () => {
  it.each([
    ['#suppress "r"\nmodel M {}', [["ModelStatement", "M"]]],
    [
      'model M { #suppress "r"\np: string; }',
      [
        ["ModelStatement", "M"],
        ["ModelProperty", "p"],
      ],
    ],
    ['#suppress "r"\ninterface I {}', [["InterfaceStatement", "I"]]],
    ['#suppress "r"\nop read(): void;', [["OperationStatement", "read"]]],
    [
      'op read(#suppress "r"\np: string): void;',
      [
        ["OperationStatement", "read"],
        ["ModelProperty", "p"],
      ],
    ],
    ['#suppress "r"\nunion U { string }', [["UnionStatement", "U"]]],
    [
      'union U { #suppress "r"\nv: string }',
      [
        ["UnionStatement", "U"],
        ["UnionVariant", "v"],
      ],
    ],
    [
      'union U { #suppress "r"\nstring }',
      [
        ["UnionStatement", "U"],
        ["UnionVariant", undefined],
      ],
    ],
    ['#suppress "r"\nenum E { a }', [["EnumStatement", "E"]]],
    [
      'enum E { #suppress "r"\na }',
      [
        ["EnumStatement", "E"],
        ["EnumMember", "a"],
      ],
    ],
    ['#suppress "r"\nscalar S extends string;', [["ScalarStatement", "S"]]],
    [
      'scalar S extends string { #suppress "r"\ninit from(value: string); }',
      [
        ["ScalarStatement", "S"],
        ["ScalarConstructor", "from"],
      ],
    ],
    ['#suppress "r"\nalias A = string;', [["AliasStatement", "A"]]],
    ['#suppress "r"\nconst c = "value";', [["ConstStatement", "c"]]],
    [
      '#suppress "r"\nextern dec example(target: unknown);',
      [["DecoratorDeclarationStatement", "example"]],
    ],
    ['#suppress "r"\nextern fn example(): string;', [["FunctionDeclarationStatement", "example"]]],
    ['#suppress "r"\nmodel `model-name` {}', [["ModelStatement", "model-name"]]],
    [
      'alias A = model { #suppress "r"\np: string; };',
      [
        ["AliasStatement", "A"],
        ["ModelDeclarationExpression", undefined],
        ["ModelProperty", "p"],
      ],
    ],
    [
      'alias A = enum { #suppress "r"\na };',
      [
        ["AliasStatement", "A"],
        ["EnumDeclarationExpression", undefined],
        ["EnumMember", "a"],
      ],
    ],
    [
      'alias A = union { #suppress "r"\nv: string };',
      [
        ["AliasStatement", "A"],
        ["UnionDeclarationExpression", undefined],
        ["UnionVariant", "v"],
      ],
    ],
    [
      'alias A = scalar extends string { #suppress "r"\ninit from(value: string); };',
      [
        ["AliasStatement", "A"],
        ["ScalarDeclarationExpression", undefined],
        ["ScalarConstructor", "from"],
      ],
    ],
    [
      'model M { p: { #suppress "r"\nq: string; }; }',
      [
        ["ModelStatement", "M"],
        ["ModelProperty", "p"],
        ["ModelExpression", undefined],
        ["ModelProperty", "q"],
      ],
    ],
  ])("collects %s", (text, expected) => {
    const [suppression] = collect(text);
    expect(context(suppression)).toEqual(expected);
  });
});

it.each(["\n", "\r\n"])("provides real source offsets for unbound nodes (%j)", (newline) => {
  const text = [
    "// Unicode: \u00e9",
    "model M {",
    '  #suppress "r" "reason"',
    "  p: string;",
    "}",
  ].join(newline);
  const [suppression] = collect(text);
  const { directive, location } = suppression;
  expect(directive.node.parent).toBeUndefined();
  expect(location.file.path).toBe("main.tsp");
  expect(location.file.text).toBe(text);
  expect(location.pos).toBe(directive.node.pos);
  expect(location.end).toBe(directive.node.end);
  expect(location.file.getLineAndCharacterOfPosition(location.pos)).toEqual({
    line: 2,
    character: 2,
  });
  expect(text.slice(location.pos, location.end).trim()).toBe('#suppress "r" "reason"');
});

it("does not mutate the AST and produces the same context after binding", async () => {
  const text = 'namespace A.B;\nmodel M { #suppress "deprecated" "reason"\np: string; }';
  const script = parse(text);
  const before = JSON.stringify(script);
  const unbound = collectSuppressions(script);
  expect(JSON.stringify(script)).toBe(before);
  const { program } = await Tester.compile(text);
  const boundScript = [...program.sourceFiles.values()].find((file) => file.file.text === text)!;
  const bound = collectSuppressions(boundScript);
  expect(bound.map(context)).toEqual(unbound.map(context));
  expect(bound[0].directive.node.parent).toBeDefined();
});

it("supplies report fields without a consumer AST walk", () => {
  const suppressions = collect(`namespace Demo.Service;
model Widget {
  #suppress "library/rule-a" "property reason"
  name: string;
}
interface Widgets {
  #suppress "library/rule-b" "operation reason"
  read(): Widget;
}`);
  const labels = new Map([
    [SyntaxKind.NamespaceStatement, "namespace"],
    [SyntaxKind.ModelStatement, "model"],
    [SyntaxKind.ModelProperty, "property"],
    [SyntaxKind.InterfaceStatement, "interface"],
    [SyntaxKind.OperationStatement, "op"],
  ]);
  const records = suppressions.map(({ directive, location, scope }) => ({
    code: directive.code,
    message: directive.message,
    sourceFile: location.file.path,
    line: location.file.getLineAndCharacterOfPosition(location.pos).line + 1,
    anchor: scope.map(({ node, name }) => `${labels.get(node.kind)}:${name}`).join("/"),
    text: location.file.text.slice(location.pos, location.end).trim(),
  }));
  expect(records).toEqual([
    {
      code: "library/rule-a",
      message: "property reason",
      sourceFile: "main.tsp",
      line: 3,
      anchor: "namespace:Demo/namespace:Service/model:Widget/property:name",
      text: '#suppress "library/rule-a" "property reason"',
    },
    {
      code: "library/rule-b",
      message: "operation reason",
      sourceFile: "main.tsp",
      line: 7,
      anchor: "namespace:Demo/namespace:Service/interface:Widgets/op:read",
      text: '#suppress "library/rule-b" "operation reason"',
    },
  ]);
});
