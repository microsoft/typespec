import { describe, expect, it } from "vitest";
import { resolvePackageTarget } from "../../../src/module-resolver/esm/resolve-package-target.js";
import { EsmResolutionContext } from "../../../src/module-resolver/esm/utils.js";

const context: EsmResolutionContext = {
  specifier: "test-lib",
  packageUrl: "file:///test/node_modules/test-lib/",
  moduleDirs: ["node_modules"],
  conditions: ["import"],
  resolveId: () => {},
};

it("returns target if it is a string", async () => {
  const result = await resolvePackageTarget(context, {
    target: "./foo.js",
  });
  expect(result).toBe("file:///test/node_modules/test-lib/foo.js");
});

describe("object value", () => {
  it("resolve first matching condition", async () => {
    const result = await resolvePackageTarget(context, {
      target: {
        require: "./bar.js",
        import: "./foo.js",
      },
    });
    expect(result).toBe("file:///test/node_modules/test-lib/foo.js");
  });

  it("resolve default if no condition match", async () => {
    const result = await resolvePackageTarget(context, {
      target: {
        require: "./bar.js",
        default: "./foo.js",
      },
    });
    expect(result).toBe("file:///test/node_modules/test-lib/foo.js");
  });

  it("resolve multiple conditions", async () => {
    const result = await resolvePackageTarget(
      { ...context, conditions: ["import", "development"] },
      {
        target: {
          require: {
            production: "./prod.js",
            development: "./dev.js",
          },
          import: {
            production: "./prod.js",
            development: "./dev.js",
          },
        },
      },
    );
    expect(result).toBe("file:///test/node_modules/test-lib/dev.js");
  });
});

it("package url doesn't need trailing /", async () => {
  const result = await resolvePackageTarget(
    { ...context, packageUrl: "file:///test/node_modules/test-lib" },
    {
      target: "./foo.js",
    },
  );
  expect(result).toBe("file:///test/node_modules/test-lib/foo.js");
});
