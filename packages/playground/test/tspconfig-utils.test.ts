import { describe, expect, it } from "vitest";
import { parse } from "yaml";
import {
  compilerOptionsToTspConfig,
  parseTspConfigYaml,
  updateTspConfigYaml,
} from "../src/react/editor-panel/tspconfig-utils.js";

describe("compilerOptionsToTspConfig", () => {
  it("serializes emitter, options and linter", () => {
    const yaml = compilerOptionsToTspConfig("@typespec/openapi3", {
      options: { "@typespec/openapi3": { "file-type": "json" } },
      linterRuleSet: { extends: ["@typespec/best-practices/recommended"] },
    });
    expect(parse(yaml)).toEqual({
      emit: ["@typespec/openapi3"],
      options: { "@typespec/openapi3": { "file-type": "json" } },
      linter: { extends: ["@typespec/best-practices/recommended"] },
    });
  });

  it("omits an empty linter rule set", () => {
    const yaml = compilerOptionsToTspConfig("@typespec/openapi3", { linterRuleSet: {} });
    expect(parse(yaml)).toEqual({ emit: ["@typespec/openapi3"] });
  });
});

describe("updateTspConfigYaml", () => {
  it("preserves comments and unknown fields when updating from the form", () => {
    const existing = [
      "# my project config",
      "emit:",
      '  - "@typespec/openapi3"',
      'output-dir: "{cwd}/tsp-output"',
      "warn-as-error: true",
      "",
    ].join("\n");

    const result = updateTspConfigYaml(existing, "@typespec/json-schema", {
      options: { "@typespec/json-schema": { "file-type": "yaml" } },
    });

    expect(result).toContain("# my project config");
    const parsed = parse(result);
    expect(parsed.emit).toEqual(["@typespec/json-schema"]);
    expect(parsed["output-dir"]).toBe("{cwd}/tsp-output");
    expect(parsed["warn-as-error"]).toBe(true);
    expect(parsed.options).toEqual({ "@typespec/json-schema": { "file-type": "yaml" } });
  });

  it("removes emit when no emitter is selected", () => {
    const existing = 'emit:\n  - "@typespec/openapi3"\n';
    const result = updateTspConfigYaml(existing, "", {});
    expect(parse(result)?.emit).toBeUndefined();
  });

  it("rebuilds from scratch when the existing content is empty", () => {
    const result = updateTspConfigYaml("", "@typespec/openapi3", {});
    expect(parse(result)).toEqual({ emit: ["@typespec/openapi3"] });
  });
});

describe("parseTspConfigYaml", () => {
  it("extracts emitter and options", () => {
    const parsed = parseTspConfigYaml(
      "emit:\n  - '@typespec/openapi3'\noptions:\n  '@typespec/openapi3':\n    file-type: json\n",
    );
    expect(parsed?.selectedEmitter).toBe("@typespec/openapi3");
    expect(parsed?.compilerOptions.options).toEqual({
      "@typespec/openapi3": { "file-type": "json" },
    });
  });

  it("returns undefined for invalid yaml", () => {
    expect(parseTspConfigYaml("emit: [\n")).toBeUndefined();
  });
});
