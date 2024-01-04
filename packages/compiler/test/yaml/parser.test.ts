import { deepStrictEqual } from "assert";
import { describe, it } from "vitest";
import { expectDiagnosticEmpty, expectDiagnostics } from "../../src/testing/expect.js";
import { extractCursor } from "../../src/testing/test-server-host.js";
import { parseYaml } from "../../src/yaml/parser.js";

describe("compiler: yaml: parser", () => {
  it("parse yaml", () => {
    const [yamlScript, diagnostics] = parseYaml(`
      foo: 123
      bar: 456
    `);
    expectDiagnosticEmpty(diagnostics);
    deepStrictEqual(yamlScript.value, { foo: 123, bar: 456 });
  });

  it("report errors as diagnostics", () => {
    const { pos, source } = extractCursor(`
    foo: 123
    ┆foo: 456
  `);
    const [_, diagnostics] = parseYaml(source);
    expectDiagnostics(diagnostics, {
      code: "yaml-duplicate-key",
      message: "Map keys must be unique",
      pos,
    });
  });
});
