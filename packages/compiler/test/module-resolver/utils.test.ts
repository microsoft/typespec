import { describe, expect, it } from "vitest";
import { parseNodeModuleSpecifier } from "../../src/module-resolver/utils.js";

describe("parseNodeModuleImport()", () => {
  it("returns null for relative imports ./", () => {
    expect(parseNodeModuleSpecifier("./foo")).toBeNull();
    expect(parseNodeModuleSpecifier("./foo.js")).toBeNull();
  });
  it("returns null for relative imports ../", () => {
    expect(parseNodeModuleSpecifier("../foo")).toBeNull();
    expect(parseNodeModuleSpecifier("../foo.js")).toBeNull();
  });

  it.each([
    ["foo", "foo", ""],
    ["foo-bar", "foo-bar", ""],
    ["foo/export", "foo", "export"],
    ["foo/nested/export", "foo", "nested/export"],
    ["@scope/pkg", "@scope/pkg", ""],
    ["@scope/pkg/export", "@scope/pkg", "export"],
    ["@scope/pkg/nested/export", "@scope/pkg", "nested/export"],
  ])("%s => pkg: %s, subPath: %s", (input, expectedPkg, expectedSubPath) => {
    const result = parseNodeModuleSpecifier(input);
    expect(result).toEqual({ packageName: expectedPkg, subPath: expectedSubPath });
  });
});
