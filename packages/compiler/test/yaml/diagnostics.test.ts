import { strictEqual } from "assert";
import { describe, it } from "vitest";
import { expectDiagnosticEmpty } from "../../src/testing/expect.js";
import { extractCursor } from "../../src/testing/test-server-host.js";
import { getLocationInYamlScript } from "../../src/yaml/diagnostics.js";
import { parseYaml } from "../../src/yaml/parser.js";

describe("compiler: yaml: diagnostics", () => {
  function parseValidYaml(code: string) {
    const [yamlScript, diagnostics] = parseYaml(code);
    expectDiagnosticEmpty(diagnostics);
    return yamlScript;
  }

  function findRightLocation(code: string, path: string[]) {
    const { pos, source } = extractCursor(code);
    const yamlScript = parseValidYaml(source);
    const location = getLocationInYamlScript(yamlScript, path);
    strictEqual(location.pos, pos);
  }

  function itFindKeyAndValueLocation(code: string, path: string[]) {
    const { pos: keyPos, source: sourceWithoutKeyCursor } = extractCursor(code, "┆K┆");
    const { pos: valuePos, source } = extractCursor(sourceWithoutKeyCursor, "┆V┆");

    it("value", () => {
      const yamlScript = parseValidYaml(source);
      const valueLocation = getLocationInYamlScript(yamlScript, path, "value");
      strictEqual(valueLocation.pos, valuePos);
    });

    it("key", () => {
      const yamlScript = parseValidYaml(source);
      const keyLocation = getLocationInYamlScript(yamlScript, path, "key");
      strictEqual(keyLocation.pos, keyPos);
    });
  }

  describe("property at root", () => {
    itFindKeyAndValueLocation(
      `
        one: abc
        ┆K┆two: ┆V┆def
        three: ghi
      `,
      ["two"],
    );
  });

  describe("property at in nested object", () => {
    itFindKeyAndValueLocation(
      `
      root: true
      nested:
        more:
          one: abc
          ┆K┆two: ┆V┆def
          three: ghi
    `,
      ["nested", "more", "two"],
    );
  });

  describe("property under array", () => {
    itFindKeyAndValueLocation(
      `
      items:
        - name: abc
        - one: abc
          ┆K┆two: ┆V┆def
          three: ghi
      `,
      ["items", "1", "two"],
    );
  });

  it("array item", () =>
    findRightLocation(
      `
      items:
        - name: abc
        - ┆one: abc
          three: ghi
      `,
      ["items", "1"],
    ));
});
