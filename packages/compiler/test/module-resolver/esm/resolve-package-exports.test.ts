import { describe, expect, it } from "vitest";
import { resolvePackageExports } from "../../../src/module-resolver/esm/resolve-package-exports.js";
import { Context } from "../../../src/module-resolver/esm/utils.js";

const context: Context = {
  importSpecifier: "test-lib",
  pkgJsonPath: "<dummy>",
  packageUrl: new URL("file:///test/node_modules/test-lib/"),
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

  it("throws error when export is missing mapping", async () => {
    await expect(
      resolvePackageExports(context, "./bar", {
        ".": "./root.js",
        "./foo": "./foo.js",
      }),
    ).rejects.toThrowError(); // TODO: validate specific error?
  });
});
