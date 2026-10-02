import { expect, it } from "vitest";
import { collectLinterDisables, createSourceFile } from "../../src/index.js";
import { expectDiagnosticEmpty, expectDiagnostics } from "../../src/testing/index.js";

it.each([
  "",
  "# comment",
  "{}",
  "null",
  "linter:",
  "linter: {}",
  "linter: { disable: null }",
  "linter: { disable: {} }",
])("returns an empty inventory for %j", (text) => {
  const [disables, diagnostics] = collectLinterDisables(text);
  expectDiagnosticEmpty(diagnostics);
  expect(disables).toEqual([]);
});

it.each(["\n", "\r\n"])("extracts local disables with key locations (%j)", (newline) => {
  const text = [
    "linter:",
    "  disable:",
    '    "@scope/library/rule": "first reason"',
    '    short/rule: ""',
    "    other/rule: |",
    "      multiple",
    "      lines",
    "",
  ].join(newline);
  const file = createSourceFile(text, "tspconfig.yaml");
  const [disables, diagnostics] = collectLinterDisables(file);
  expectDiagnosticEmpty(diagnostics);
  expect(disables?.map(({ code, message }) => [code, message])).toEqual([
    ["@scope/library/rule", "first reason"],
    ["short/rule", ""],
    ["other/rule", "multiple\nlines\n"],
  ]);
  const location = disables![0].location;
  expect(location.file).toBe(file);
  expect(file.getLineAndCharacterOfPosition(location.pos)).toEqual({ line: 2, character: 4 });
  expect(text.slice(location.pos, location.end)).toBe('"@scope/library/rule"');
});

it("does not validate unrelated settings, follow extends, or count disabled enable entries", () => {
  const [disables, diagnostics] = collectLinterDisables(`
extends: not-present.yaml
future-setting: { anything: true }
emit: 123
linter:
  extends: [file:not-present.yaml]
  enable: { ignored/rule: false }
  future-setting: true
  disable: { alias/rule: reason }
`);
  expectDiagnosticEmpty(diagnostics);
  expect(disables?.map(({ code, message }) => [code, message])).toEqual([["alias/rule", "reason"]]);
});

it("keeps YAML source order, including numeric-looking string keys", () => {
  const [disables, diagnostics] = collectLinterDisables(
    'linter: { disable: { "10": ten, "2": two, "1": one } }',
  );
  expectDiagnosticEmpty(diagnostics);
  expect(disables?.map(({ code }) => code)).toEqual(["10", "2", "1"]);
});

it("returns warnings alongside a successful inventory", () => {
  const [disables, diagnostics] = collectLinterDisables(
    "linter: { disable: { r: !custom reason } }",
  );
  expectDiagnostics(diagnostics, { code: "yaml-tag-resolve-failed", severity: "warning" });
  expect(disables?.map(({ code, message }) => [code, message])).toEqual([["r", "reason"]]);
});

it("does not resolve values in unrelated settings", () => {
  const [disables, diagnostics] = collectLinterDisables(
    "unrelated: *missing\nlinter: { disable: { r: reason } }",
  );
  expectDiagnosticEmpty(diagnostics);
  expect(disables?.map(({ code }) => code)).toEqual(["r"]);
});

it("resolves same-file mapping and justification aliases with the original key location", () => {
  const text = `reason: &reason explanation
rules: &rules
  library/rule: *reason
settings: &settings
  disable: *rules
linter: *settings
`;
  const [disables, diagnostics] = collectLinterDisables(createSourceFile(text, "config.yaml"));
  expectDiagnosticEmpty(diagnostics);
  expect(disables?.map(({ code, message }) => [code, message])).toEqual([
    ["library/rule", "explanation"],
  ]);
  const location = disables![0].location;
  expect(location.file.getLineAndCharacterOfPosition(location.pos)).toEqual({
    line: 2,
    character: 2,
  });
  expect(text.slice(location.pos, location.end)).toBe("library/rule");
});

it.each([
  "42",
  "[]",
  "linter: false",
  "linter: []",
  "linter: { disable: false }",
  "linter: { disable: [] }",
  "linter: { disable: { r: 42 } }",
  "linter: { disable: { r: false } }",
  "linter: { disable: { r: null } }",
  "linter: { disable: { r } }",
  "linter:\n  disable:\n    r:\n",
  "linter: { disable: { r: [] } }",
  "linter: { disable: { r: {} } }",
  "linter: { disable: &rules { r: *rules } }",
  "linter: { disable: { 123: reason } }",
  "linter: { disable: { ? [a, b] : reason } }",
  "linter: { disable: { valid: reason, invalid: 42 } }",
])("reports invalid relevant config without a partial inventory: %s", (text) => {
  const [disables, diagnostics] = collectLinterDisables(text);
  expect(disables).toBeUndefined();
  expectDiagnostics(diagnostics, { code: "invalid-schema" });
});

it("reports invalid YAML", () => {
  const [disables, diagnostics] = collectLinterDisables("linter: [");
  expect(disables).toBeUndefined();
  expect(diagnostics.some((d) => d.severity === "error" && d.code.startsWith("yaml-"))).toBe(true);
});

it("reports duplicate YAML keys rather than dropping a suppression", () => {
  const [disables, diagnostics] = collectLinterDisables(
    "linter:\n  disable:\n    r: first\n    r: second\n",
  );
  expect(disables).toBeUndefined();
  expectDiagnostics(diagnostics, { code: "yaml-duplicate-key" });
});

it.each([
  "linter: *missing",
  "linter: { disable: *missing }",
  "linter: { disable: { r: *missing } }",
  "linter: { disable: { ? *missing : reason } }",
])("reports unresolved aliases instead of throwing: %s", (text) => {
  const [disables, diagnostics] = collectLinterDisables(text);
  expect(disables).toBeUndefined();
  expectDiagnostics(diagnostics, { code: "yaml-alias-not-found" });
});

it("reports errors at the invalid value rather than the start of the file", () => {
  const file = createSourceFile("linter:\n  disable:\n    r: 123\n", "config.yaml");
  const [disables, diagnostics] = collectLinterDisables(file);
  expect(disables).toBeUndefined();
  expectDiagnostics(diagnostics, { code: "invalid-schema" });
  expect(diagnostics[0].target).toMatchObject({ file, pos: file.text.indexOf("123") });
});

it("anchors a missing flow-mapping justification to its rule key", () => {
  const file = createSourceFile("linter: { disable: { rule } }", "config.yaml");
  const [disables, diagnostics] = collectLinterDisables(file);
  expect(disables).toBeUndefined();
  expectDiagnostics(diagnostics, { code: "invalid-schema" });
  expect(diagnostics[0].target).toMatchObject({ file, pos: file.text.indexOf("rule") });
});
