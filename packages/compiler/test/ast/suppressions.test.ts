import { expect, it } from "vitest";
import { collectSuppressions, getSuppressions, parse, SyntaxKind } from "../../src/ast/index.js";
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
  const [beforeReporting] = getSuppressions(program);
  expect(beforeReporting.directive.node).toBe(bound.directive.node);
  expect(beforeReporting.used).toBe(false);
  program.reportDiagnostic({
    code: "deprecated",
    severity: "warning",
    message: "matched after compilation",
    target: bound.target,
  });
  expect(getSuppressions(program)[0].used).toBe(true);
  expect(beforeReporting.used).toBe(false);
});

it("reports project suppressions, including unmatched and unavailable diagnostic sources", async () => {
  const { program } = await Tester.files({
    "node_modules/example/package.json": JSON.stringify({
      name: "example",
      version: "1.0.0",
      tspMain: "main.tsp",
    }),
    "node_modules/example/main.tsp": '#suppress "deprecated"\nmodel LibraryModel {}',
  }).compile(`
    import "example";
    #deprecated "old"
    model Old {}
    namespace Example {
      model M {
        #suppress "deprecated" "intentional"
        p: Old;
      }
      #suppress "deprecated" "not needed"
      #suppress "not-loaded/rule" "another configuration"
      model N {}
    }
  `);
  const suppressions = getSuppressions(program);
  expect(suppressions.map(({ directive, used }) => [directive.code, used])).toEqual([
    ["deprecated", true],
    ["deprecated", false],
    ["not-loaded/rule", false],
  ]);
  expect(suppressions[0].scope.map(({ name }) => name)).toEqual(["Example", "M", "p"]);
});

it.each([false, true])("reflects whether the linter rule is enabled (%s)", async (enabled) => {
  const code = "@typespec/compiler/unused-template-parameter";
  const { program } = await Tester.compile(
    `#suppress "${code}" "kept for compatibility"\nmodel M<T> { value: string; }`,
    { compilerOptions: { linterRuleSet: { enable: { [code]: enabled } } } },
  );
  expect(getSuppressions(program)[0].used).toBe(enabled);
});

it("reports unmatched when checking errors prevent linting", async () => {
  const code = "@typespec/compiler/unused-template-parameter";
  const [{ program }, diagnostics] = await Tester.compileAndDiagnose(
    `#suppress "${code}" "kept for compatibility"\nmodel M<T> { value: Unknown; }`,
    { compilerOptions: { linterRuleSet: { enable: { [code]: true } } } },
  );
  expect(diagnostics.map(({ code }) => code)).toEqual(["invalid-ref"]);
  expect(getSuppressions(program)[0].used).toBe(false);
});
