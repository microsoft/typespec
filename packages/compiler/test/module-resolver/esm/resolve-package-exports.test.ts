import { describe, expect, it } from "vitest";
import { resolvePackageExports } from "../../../src/module-resolver/esm/resolve-package-exports.js";
import { EsmResolutionContext } from "../../../src/module-resolver/esm/utils.js";

const context: EsmResolutionContext = {
  specifier: "test-lib",
  packageUrl: "file:///test/node_modules/test-lib/",
  moduleDirs: ["node_modules"],
  conditions: ["import"],
  resolveId: () => {},
};

describe("exports is a string", () => {
  it("returns value if subpath is .", async () => {
    const result = await resolvePackageExports(context, ".", "./foo.js");
    expect(result).toBe("file:///test/node_modules/test-lib/foo.js");
  });
  it("returns value if subpath is anything else than .", async () => {
    const result = await resolvePackageExports(context, ".", "./foo.js");
    expect(result).toBe("file:///test/node_modules/test-lib/foo.js");
  });
});

describe("exports is an object", () => {
  it("resolve matching subpath", async () => {
    const result = await resolvePackageExports(context, ".", {
      ".": "./root.js",
      "./foo": "./foo.js",
    });
    expect(result).toBe("file:///test/node_modules/test-lib/root.js");
  });

  it("resolve sub path", async () => {
    const result = await resolvePackageExports(context, "./foo", {
      ".": "./root.js",
      "./foo": "./foo.js",
    });
    expect(result).toBe("file:///test/node_modules/test-lib/foo.js");
  });

  describe("wildcard", () => {
    it("resolve file at the root", async () => {
      const result = await resolvePackageExports(context, "./lib/foo.js", {
        "./lib/*": "./dist/*",
      });
      expect(result).toBe("file:///test/node_modules/test-lib/dist/foo.js");
    });
    it("resolve file nested", async () => {
      const result = await resolvePackageExports(context, "./lib/sub/folder/foo.js", {
        "./lib/*": "./dist/*",
      });
      expect(result).toBe("file:///test/node_modules/test-lib/dist/sub/folder/foo.js");
    });
  });

  it("throws error when export is missing mapping", async () => {
    await expect(
      resolvePackageExports(context, "./bar", {
        ".": "./root.js",
        "./foo": "./foo.js",
      }),
    ).rejects.toThrowError(
      `Could not resolve import "test-lib"  using exports defined in file:///test/node_modules/test-lib/.`,
    );
  });
});
