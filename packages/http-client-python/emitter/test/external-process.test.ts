import { load } from "js-yaml";
import { ok, strictEqual } from "assert";
import { describe, it } from "vitest";
import { dumpCodeModelToYaml } from "../src/external-process.js";

describe("typespec-python: external-process", () => {
  // The Python generator parses the emitted YAML with PyYAML (YAML 1.1), where a plain
  // scalar such as `2020_01_01` is interpreted as the integer `20200101`. js-yaml dumps
  // using YAML 1.2 rules and would otherwise leave such string scalars unquoted, so we
  // must force-quote strings to keep enum member names (and other string values) intact.
  it("force-quotes string scalars that YAML 1.1 would misinterpret", () => {
    const yaml = dumpCodeModelToYaml({ name: "2020_01_01" });
    // The scalar must be quoted, otherwise PyYAML reads it back as the integer 20200101.
    ok(
      yaml.includes('"2020_01_01"'),
      `expected the underscore scalar to be quoted, got: ${yaml}`,
    );
    ok(
      !/name:\s*2020_01_01\s*$/m.test(yaml),
      `expected no unquoted underscore scalar, got: ${yaml}`,
    );
  });

  it("keeps string values as strings after a round-trip", () => {
    const codeModel = { name: "2020_01_01", value: "2020-01-01", plain: "hello" };
    const roundTripped = load(dumpCodeModelToYaml(codeModel)) as Record<string, unknown>;
    strictEqual(roundTripped.name, "2020_01_01");
    strictEqual(roundTripped.value, "2020-01-01");
    strictEqual(roundTripped.plain, "hello");
  });
});
