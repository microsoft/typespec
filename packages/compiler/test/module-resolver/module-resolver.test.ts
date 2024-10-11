import { describe, expect, it } from "vitest";
import {
  resolveModule,
  ResolveModuleError,
  type ResolveModuleHost,
} from "../../src/module-resolver/module-resolver.js";
import { TestHostError } from "../../src/testing/types.js";

function mkFs(files: Record<string, string>): {
  host: ResolveModuleHost;
  fs: Map<string, string>;
} {
  const fs = new Map<string, string>();
  for (const [file, content] of Object.entries(files)) {
    fs.set(file, content);
  }

  const host: ResolveModuleHost = {
    realpath: (path) => Promise.resolve(path),
    stat: async (path: string) => {
      if (fs.has(path)) {
        return {
          isDirectory: () => false,
          isFile: () => true,
        };
      }

      for (const fsPath of fs.keys()) {
        if (fsPath.startsWith(path) && fsPath !== path) {
          return {
            isDirectory: () => true,
            isFile: () => false,
          };
        }
      }

      throw new TestHostError(`File ${path} not found`, "ENOENT");
    },
    readFile: async (path: string) => {
      const contents = fs.get(path);
      if (contents === undefined) {
        throw new TestHostError(`File ${path} not found.`, "ENOENT");
      }
      return contents;
    },
  };
  return { fs, host };
}

describe("resolve any extension", () => {
  it.each([".js", ".mjs", ".ts", ".json", ".tsp"])("%s", async (ext) => {
    const { host } = mkFs({
      [`/ws/proj/a${ext}`]: "",
    });

    const resolved = await resolveModule(host, `./a${ext}`, { baseDir: "/ws/proj" });
    expect(resolved).toEqual({ type: "file", path: `/ws/proj/a${ext}` });
  });
});

describe("relative file", () => {
  const { host } = mkFs({
    "/ws/proj1/a.js": "",
    "/ws/proj1/b.js": "",
    "/ws/proj2/a.js": "",
    "/ws/proj2/b.js": "",
  });

  it("find ./ file", async () => {
    const resolved = await resolveModule(host, "./a.js", { baseDir: "/ws/proj1" });
    expect(resolved).toEqual({ type: "file", path: "/ws/proj1/a.js" });
  });

  it("find ../ file", async () => {
    const resolved = await resolveModule(host, "../proj1/a.js", { baseDir: "/ws/proj2" });
    expect(resolved).toEqual({ type: "file", path: "/ws/proj1/a.js" });
  });
});

describe("loads directory", () => {
  const { host } = mkFs({
    "/ws/proj/a.js": "",
    "/ws/proj/area1/index.js": "",
    "/ws/proj/area2/index.mjs": "",
    "/ws/proj/area3/index.js": "",
    "/ws/proj/area3/index.mjs": "",
    "/ws/proj/area3/index.tsp": "",
  });

  describe("default behavior", () => {
    it("find index.js", async () => {
      const resolved = await resolveModule(host, "./area1", { baseDir: "/ws/proj" });
      expect(resolved).toEqual({ type: "file", path: "/ws/proj/area1/index.js" });
    });
    it("find index.mjs", async () => {
      const resolved = await resolveModule(host, "./area2", { baseDir: "/ws/proj" });
      expect(resolved).toEqual({ type: "file", path: "/ws/proj/area2/index.mjs" });
    });
    it("find index.mjs over index.js", async () => {
      const resolved = await resolveModule(host, "./area3", { baseDir: "/ws/proj" });
      expect(resolved).toEqual({ type: "file", path: "/ws/proj/area3/index.mjs" });
    });
  });

  it("resolve custom index file list in order", async () => {
    const resolved = await resolveModule(host, "./area3", {
      baseDir: "/ws/proj",
      directoryIndexFiles: ["index.tsp", "index.mjs", "index.js"],
    });
    expect(resolved).toEqual({ type: "file", path: "/ws/proj/area3/index.tsp" });
  });
});

describe("packages", () => {
  it("resolve using `main` file", async () => {
    const { host } = mkFs({
      "/ws/proj/node_modules/test-lib/package.json": JSON.stringify({ main: "entry.js" }),
      "/ws/proj/node_modules/test-lib/entry.js": "",
    });
    const resolved = await resolveModule(host, "test-lib", {
      baseDir: "/ws/proj",
    });
    expect(resolved).toMatchObject({
      type: "module",
      path: "/ws/proj/node_modules/test-lib",
      mainFile: "/ws/proj/node_modules/test-lib/entry.js",
    });
  });

  it("resolve using custom resolveMain resolution", async () => {
    const { host } = mkFs({
      "/ws/proj/node_modules/test-lib/package.json": JSON.stringify({
        main: "entry.js",
        tspMain: "entry.tsp",
      }),
      "/ws/proj/node_modules/test-lib/entry.js": "",
      "/ws/proj/node_modules/test-lib/entry.tsp": "",
    });
    const resolved = await resolveModule(host, "test-lib", {
      baseDir: "/ws/proj",
      resolveMain: (pkg) => pkg.tspMain,
    });
    expect(resolved).toMatchObject({
      type: "module",
      path: "/ws/proj/node_modules/test-lib",
      mainFile: "/ws/proj/node_modules/test-lib/entry.tsp",
    });
  });

  describe("when exports is defined", () => {
    describe("no condition", () => {
      const { host } = mkFs({
        "/ws/proj/node_modules/test-lib/package.json": JSON.stringify({
          exports: { ".": "./entry.js", "./named": "./named.js" },
        }),
        "/ws/proj/node_modules/test-lib/entry.js": "",
        "/ws/proj/node_modules/test-lib/named.js": "",
      });
      it("resolve . export without condition", async () => {
        const resolved = await resolveModule(host, "test-lib", {
          baseDir: "/ws/proj",
        });
        expect(resolved).toMatchObject({
          type: "module",
          path: "/ws/proj/node_modules/test-lib",
          mainFile: "/ws/proj/node_modules/test-lib/entry.js",
        });
      });

      it("resolve named export without condition", async () => {
        const resolved = await resolveModule(host, "test-lib/named", {
          baseDir: "/ws/proj",
        });
        expect(resolved).toMatchObject({
          type: "module",
          path: "/ws/proj/node_modules/test-lib",
          mainFile: "/ws/proj/node_modules/test-lib/named.js",
        });
      });
    });

    describe("condition", () => {
      const { host } = mkFs({
        "/ws/proj/node_modules/test-lib/package.json": JSON.stringify({
          exports: {
            ".": {
              import: "./entry.js",
              require: "./entry.cjs",
              default: "./entry.default.js",
            },
          },
        }),
        "/ws/proj/node_modules/test-lib/entry.js": "",
        "/ws/proj/node_modules/test-lib/entry.cjs": "",
        "/ws/proj/node_modules/test-lib/entry.default.js": "",
      });

      it("resolve default condition if no condition are specified", async () => {
        const resolved = await resolveModule(host, "test-lib", {
          baseDir: "/ws/proj",
        });
        expect(resolved).toMatchObject({
          type: "module",
          path: "/ws/proj/node_modules/test-lib",
          mainFile: "/ws/proj/node_modules/test-lib/entry.default.js",
        });
      });

      it("respect condition order", async () => {
        const resolved = await resolveModule(host, "test-lib", {
          baseDir: "/ws/proj",
          conditions: ["require", "import"],
        });
        expect(resolved).toMatchObject({
          type: "module",
          path: "/ws/proj/node_modules/test-lib",
          mainFile: "/ws/proj/node_modules/test-lib/entry.js",
        });
      });
    });

    describe("invalid exports", () => {
      it("throws error if export path point to invalid file", async () => {
        const { host } = mkFs({
          "/ws/proj/node_modules/test-lib/package.json": JSON.stringify({
            exports: { ".": "./missing.js" },
          }),
        });
        await expect(resolveModule(host, "test-lib", { baseDir: "/ws/proj" })).rejects.toThrowError(
          new ResolveModuleError(
            "INVALID_MODULE_EXPORT_TARGET",
            `Import "test-lib" resolving to "/ws/proj/node_modules/test-lib/missing.js" is not a file.`,
          ),
        );
      });
      it("throws error if export path is not starting with ./", async () => {
        const { host } = mkFs({
          "/ws/proj/node_modules/test-lib/package.json": JSON.stringify({
            exports: { ".": "index.js" },
          }),
          "/ws/proj/node_modules/test-lib/index.js": "",
        });
        await expect(resolveModule(host, "test-lib", { baseDir: "/ws/proj" })).rejects.toThrowError(
          new ResolveModuleError(
            "INVALID_MODULE_EXPORT_TARGET",
            `Could not resolve import "test-lib"  using exports defined in file:///ws/proj/node_modules/test-lib. Invalid mapping: "index.js".`,
          ),
        );
      });

      it("throws error if export is missing", async () => {
        const { host } = mkFs({
          "/ws/proj/node_modules/test-lib/package.json": JSON.stringify({
            exports: { ".": "index.js" },
          }),
          "/ws/proj/node_modules/test-lib/index.js": "",
        });
        await expect(
          resolveModule(host, "test-lib/named", { baseDir: "/ws/proj" }),
        ).rejects.toThrowError(
          new ResolveModuleError(
            "MODULE_NOT_FOUND",
            `Could not resolve import "test-lib/named"  using exports defined in file:///ws/proj/node_modules/test-lib.`,
          ),
        );
      });

      describe("missing condition with fallbackOnMissingCondition", () => {
        describe("for . export", () => {
          it("fallback to main if default is not set", async () => {
            const { host } = mkFs({
              "/ws/proj/node_modules/test-lib/package.json": JSON.stringify({
                main: "main.js",
                exports: {
                  ".": {
                    import: "./index.js",
                  },
                },
              }),
              "/ws/proj/node_modules/test-lib/main.js": "",
              "/ws/proj/node_modules/test-lib/index.js": "",
            });

            const resolved = await resolveModule(host, "test-lib", {
              baseDir: "/ws/proj",
              conditions: ["typespec"],
              fallbackOnMissingCondition: true,
            });

            expect(resolved).toMatchObject({
              mainFile: "/ws/proj/node_modules/test-lib/main.js",
            });
          });

          it("fallback to main if default is set", async () => {
            const { host } = mkFs({
              "/ws/proj/node_modules/test-lib/package.json": JSON.stringify({
                main: "main.js",
                exports: {
                  ".": {
                    default: "./index.js",
                  },
                },
              }),
              "/ws/proj/node_modules/test-lib/main.js": "",
              "/ws/proj/node_modules/test-lib/index.js": "",
            });

            const resolved = await resolveModule(host, "test-lib", {
              baseDir: "/ws/proj",
              conditions: ["typespec"],
              fallbackOnMissingCondition: true,
            });

            expect(resolved).toMatchObject({
              mainFile: "/ws/proj/node_modules/test-lib/main.js",
            });
          });

          it("fallback to main if using no condition", async () => {
            const { host } = mkFs({
              "/ws/proj/node_modules/test-lib/package.json": JSON.stringify({
                main: "main.js",
                exports: {
                  ".": "./index.js",
                },
              }),
              "/ws/proj/node_modules/test-lib/main.js": "",
              "/ws/proj/node_modules/test-lib/index.js": "",
            });

            const resolved = await resolveModule(host, "test-lib", {
              baseDir: "/ws/proj",
              conditions: ["typespec"],
              fallbackOnMissingCondition: true,
            });

            expect(resolved).toMatchObject({
              mainFile: "/ws/proj/node_modules/test-lib/main.js",
            });
          });
        });

        describe("for named export", () => {
          it("throws an error for named path", async () => {
            const { host } = mkFs({
              "/ws/proj/node_modules/test-lib/package.json": JSON.stringify({
                main: "main.js",
                exports: {
                  "./named": {
                    import: "./index.js",
                  },
                },
              }),
              "/ws/proj/node_modules/test-lib/main.js": "",
              "/ws/proj/node_modules/test-lib/index.js": "",
            });

            await expect(
              resolveModule(host, "test-lib/named", {
                baseDir: "/ws/proj",
                conditions: ["typespec"],
                fallbackOnMissingCondition: true,
              }),
            ).rejects.toThrowError(
              new ResolveModuleError(
                "MODULE_NOT_FOUND",
                `Could not resolve import "test-lib/named"  using exports defined in file:///ws/proj/node_modules/test-lib.`,
              ),
            );
          });
        });
      });
    });
  });
});

describe("resolve self", () => {
  const { host } = mkFs({
    "/ws/proj/package.json": JSON.stringify({ name: "@scope/proj", main: "entry.js" }),
    "/ws/proj/entry.js": "",
    "/ws/proj/nested/index.js": "",
    "/ws/proj/node_modules/test-lib/package.json": JSON.stringify({ main: "entry.js" }),
    "/ws/proj/node_modules/test-lib/entry.js": "",
    "/ws/proj/node_modules/test-lib/nested/index.js": "",
  });

  it.each([
    ["at the same level", "/ws/proj"],
    ["nested", "/ws/proj/nested"],
    ["lookup parent package.json", "/ws/proj/node_modules/test-lib/nested"],
  ])("%s", async (_, baseDir) => {
    const resolved = await resolveModule(host, "@scope/proj", {
      baseDir,
    });
    expect(resolved).toMatchObject({
      type: "module",
      path: "/ws/proj",
      mainFile: "/ws/proj/entry.js",
    });
  });

  it("prioritize local node_modules over self from multiple parent up", async () => {
    const { host } = mkFs({
      "/ws/proj/package.json": JSON.stringify({ name: "@scope/proj", main: "entry.js" }),
      "/ws/proj/entry.js": "",
      "/ws/proj/nested/index.js": "",
      "/ws/proj/node_modules/test-lib/package.json": JSON.stringify({ main: "entry.js" }),
      "/ws/proj/node_modules/test-lib/entry.js": "",
      "/ws/proj/node_modules/test-lib/nested/index.js": "",
      // @scope/proj installed locally
      "/ws/proj/node_modules/test-lib/node_modules/@scope/proj/package.json": JSON.stringify({
        name: "@scope/proj",
        main: "entry.js",
      }),
      "/ws/proj/node_modules/test-lib/node_modules/@scope/proj/entry.js": "",
    });

    const resolved = await resolveModule(host, "@scope/proj", {
      baseDir: "/ws/proj/node_modules/test-lib/nested",
    });
    const path = "/ws/proj/node_modules/test-lib/node_modules/@scope/proj";
    expect(resolved).toMatchObject({
      type: "module",
      path,
      mainFile: `${path}/entry.js`,
    });
  });
});
