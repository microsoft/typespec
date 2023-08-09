import { deepStrictEqual } from "assert";
import { expectDiagnosticEmpty, expectDiagnostics } from "../../src/testing/expect.js";
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
    const [_, diagnostics] = parseYaml(`
      foo: 123
      foo: 456
    `);
    expectDiagnostics(diagnostics, {
      code: "yaml-duplicate-key",
      message: "Map keys must be unique",
    });
  });
});
