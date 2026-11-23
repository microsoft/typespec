import { expect, it } from "vitest";
import { collectLinterDisables, createSourceFile } from "../../src/index.js";
import { expectDiagnosticEmpty, expectDiagnostics } from "../../src/testing/index.js";

it.each(["", "linter: {}", "linter: { disable: null }"])(
  "returns an empty inventory for %j",
  (text) => {
    expect(collectLinterDisables(text)).toEqual([[], []]);
  },
);

it("extracts local disables in source order with reasons and key locations", () => {
  const file = createSourceFile(
    `extends: not-present.yaml
unrelated: *missing
linter:
  extends: [file:not-present.yaml]
  enable: { ignored/rule: false }
  disable:
    "@scope/library/rule": "reason"
    "10": ""
    "2": |
      multiple
      lines
`,
    "tspconfig.yaml",
  );
  const [disables, diagnostics] = collectLinterDisables(file);
  expectDiagnosticEmpty(diagnostics);
  expect(disables?.map(({ code, message }) => [code, message])).toEqual([
    ["@scope/library/rule", "reason"],
    ["10", ""],
    ["2", "multiple\nlines\n"],
  ]);
  const location = disables![0].location;
  expect(location.file).toBe(file);
  expect(file.getLineAndCharacterOfPosition(location.pos)).toEqual({ line: 6, character: 4 });
  expect(file.text.slice(location.pos, location.end)).toBe('"@scope/library/rule"');
});

it("resolves same-file aliases while preserving original key locations", () => {
  const text = `reason: &reason explanation
rules: &rules
  library/rule: *reason
linter: { disable: *rules }
`;
  const [disables, diagnostics] = collectLinterDisables(text);
  expectDiagnosticEmpty(diagnostics);
  expect(disables).toMatchObject([{ code: "library/rule", message: "explanation" }]);
  const location = disables![0].location;
  expect(text.slice(location.pos, location.end)).toBe("library/rule");
});

it("returns warnings alongside a successful inventory", () => {
  const [disables, diagnostics] = collectLinterDisables(
    "linter: { disable: { r: !custom reason } }",
  );
  expectDiagnostics(diagnostics, { code: "yaml-tag-resolve-failed", severity: "warning" });
  expect(disables).toMatchObject([{ code: "r", message: "reason" }]);
});

it.each([
  ["linter: []", "invalid-schema"],
  ["linter: { disable: { valid: reason, invalid: 42 } }", "invalid-schema"],
  ["linter: { disable: { rule } }", "invalid-schema"],
  ["linter: { disable: { r: *missing } }", "yaml-alias-not-found"],
  ["linter:\n  disable:\n    r: first\n    r: second\n", "yaml-duplicate-key"],
])("reports invalid config without a partial inventory: %s", (text, code) => {
  const [disables, diagnostics] = collectLinterDisables(text);
  expect(disables).toBeUndefined();
  expectDiagnostics(diagnostics, { code });
});

it("anchors a missing justification to its rule key", () => {
  const file = createSourceFile("linter: { disable: { rule } }", "config.yaml");
  const [, diagnostics] = collectLinterDisables(file);
  expect(diagnostics[0].target).toMatchObject({ file, pos: file.text.indexOf("rule") });
});
