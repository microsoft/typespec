import { expect, it } from "vitest";
import { collectSuppressions, parse, SyntaxKind } from "../../src/ast/index.js";
import { createSourceFile } from "../../src/index.js";
import { expectDiagnosticEmpty } from "../../src/testing/index.js";
import { Tester } from "../tester.js";

function collect(text: string) {
  const script = parse(createSourceFile(text, "main.tsp"));
  expectDiagnosticEmpty(script.parseDiagnostics);
  return collectSuppressions(script);
}

it("collects directives without resolving codes or dependencies", () => {
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
});

it("leaves parse errors available and skips directives without a code", () => {
  expect(collect("")).toEqual([]);
  const script = parse("#suppress\nmodel M {}\n#suppress 123\nmodel N {}");
  expect(collectSuppressions(script)).toEqual([]);
  expect(script.parseDiagnostics.length).toBeGreaterThan(0);
});

it("includes file namespaces, declaration context, and unbound source locations", () => {
  const suppressions = collect(`#suppress "before"
using Other;
#suppress "namespace"
namespace A.B;
model M {
  #suppress "property"
  p: string;
}
interface I {
  #suppress "operation"
  read(): M;
}`);
  expect(suppressions.map(({ scope }) => scope.map(({ name }) => name))).toEqual([
    [],
    ["A", "B"],
    ["A", "B", "M", "p"],
    ["A", "B", "I", "read"],
  ]);
  const { directive, target, location } = suppressions[2];
  expect(target.kind).toBe(SyntaxKind.ModelProperty);
  expect(directive.node.parent).toBeUndefined();
  expect(location.file.path).toBe("main.tsp");
  expect(location.file.getLineAndCharacterOfPosition(location.pos)).toEqual({
    line: 5,
    character: 2,
  });
  expect(location.file.text.slice(location.pos, location.end).trim()).toBe('#suppress "property"');
});

it("deduplicates shared dotted-namespace directives, retaining the deepest attachment", () => {
  const suppressions = collect(`
    namespace Outer {
      #suppress "rule" "first"
      #suppress "rule" "second"
      namespace A.B {}
    }
  `);
  expect(suppressions.map(({ directive }) => directive.message)).toEqual(["first", "second"]);
  for (const { target, scope } of suppressions) {
    expect(scope.map(({ name }) => name)).toEqual(["Outer", "A", "B"]);
    expect(target).toBe(scope[2].node);
  }
});

it.each([
  ['op read(#suppress "r"\np: string): void;', ["read", "p"]],
  ['model M { p: { #suppress "r"\nq: string; }; }', ["M", "p", undefined, "q"]],
  ['alias A = model { #suppress "r"\np: string; };', ["A", undefined, "p"]],
])("distinguishes anonymous containers from syntax wrappers: %s", (text, names) => {
  expect(collect(text)[0].scope.map(({ name }) => name)).toEqual(names);
});

it("preserves the AST and shares directive identities with the compiler tracker", async () => {
  const text = 'namespace A.B;\nmodel M { #suppress "deprecated"\np: string; }';
  const script = parse(text);
  const before = JSON.stringify(script);
  const unbound = collectSuppressions(script);
  expect(JSON.stringify(script)).toBe(before);

  const { program } = await Tester.compile(text);
  const boundScript = [...program.sourceFiles.values()].find((file) => file.file.text === text)!;
  const [bound] = collectSuppressions(boundScript);
  expect(bound.scope.map(({ name }) => name)).toEqual(unbound[0].scope.map(({ name }) => name));
  const tracker = program.suppressionTracker!;
  expect(tracker.getUnusedSuppressions()[0].directive.node).toBe(bound.directive.node);
  tracker.markUsed(bound.directive.node);
  expect(tracker.getUnusedSuppressions()).toEqual([]);
});
