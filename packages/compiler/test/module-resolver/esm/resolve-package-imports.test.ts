import { describe, expect, it } from "vitest";
import { resolvePackageImports } from "../../../src/module-resolver/esm/resolve-package-imports.js";
import { EsmResolutionContext } from "../../../src/module-resolver/esm/utils.js";

const context: Omit<EsmResolutionContext, "specifier"> = {
  packageUrl: "file:///test/",
  moduleDirs: [],
  conditions: ["import"],
  resolveId: async () => undefined,
};

describe("imports is an object", () => {
  it("resolve matching subpath", async () => {
    const result = await resolvePackageImports(
      { ...context, specifier: "#foo" },
      {
        "#foo": "./foo.js",
        "#bar": "./bar.js",
      },
    );
    expect(result).toBe("file:///test/foo.js");
  });

  describe("wildcard", () => {
    it("resolve file at the root", async () => {
      const result = await resolvePackageImports(
        { ...context, specifier: "#lib/foo.js" },
        { "#lib/*": "./dist/*" },
      );
      expect(result).toBe("file:///test/dist/foo.js");
    });

    it("resolve file nested", async () => {
      const result = await resolvePackageImports(
        { ...context, specifier: "#lib/sub/folder/foo.js" },
        { "#lib/*": "./dist/*" },
      );
      expect(result).toBe("file:///test/dist/sub/folder/foo.js");
    });
  });

  it("throws error when export is missing mapping", async () => {
    await expect(
      resolvePackageImports({ ...context, specifier: "#bar" }, { "#foo": "./foo.js" }),
    ).rejects.toThrowError(
      `Could not resolve import "#bar"  using imports defined in file:///test/.`,
    );
  });
});
