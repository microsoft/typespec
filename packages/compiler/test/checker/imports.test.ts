import { deepStrictEqual, ok } from "assert";
import { describe, it } from "vitest";
import {
  LibraryLocationContext,
  LocationContext,
  ModuleLibraryMetadata,
  Program,
  ProjectLocationContext,
} from "../../src/index.js";
import { expectDiagnostics, mockFile, resolveVirtualPath } from "../../src/testing/index.js";
import { PackageJson } from "../../src/types/package-json.js";
import { Tester } from "../tester.js";

describe("compiler: imports", () => {
  function expectFileLoaded(program: Program, files: { typespec?: string[]; js?: string[] }) {
    const expectFileIn = (file: string, map: Map<string, unknown>) => {
      const vFile = resolveVirtualPath(file);
      ok(
        map.has(vFile),
        [
          `Expected ${vFile} to have been loaded but not present in:`,
          ...[...map.keys()].map((x) => ` - ${x}`),
        ].join("\n"),
      );
    };
    if (files.typespec) {
      for (const file of files.typespec) {
        expectFileIn(file, program.sourceFiles);
      }
    }
    if (files.js) {
      for (const file of files.js) {
        expectFileIn(file, program.jsSourceFiles);
      }
    }
  }

  it("import relative TypeSpec file", async () => {
    const { program } = await Tester.files({
      "b.tsp": `model B { }`,
    }).compile(`
      import "./b.tsp";
      model A extends B { }
    `);
    expectFileLoaded(program, { typespec: ["main.tsp", "b.tsp"] });
  });

  it("import relative JS file", async () => {
    const { program } = await Tester.files({
      "blue.js": mockFile.js({ $blue() {} }),
    }).compile(`
      import "./blue.js";
      @blue
      model A  {}
    `);
    expectFileLoaded(program, { typespec: ["main.tsp"], js: ["blue.js"] });
  });

  it("import relative JS file in parent folder", async () => {
    const { program } = await Tester.files({
      "blue.js": mockFile.js({ $blue() {} }),
      "proj/main.tsp": `
      import "../blue.js";
      @blue
      model A  {}
      `,
    }).compile(`import "./proj/main.tsp";`);
    expectFileLoaded(program, { typespec: ["proj/main.tsp"], js: ["blue.js"] });
  });

  it("import relative TS file", async () => {
    const { program } = await Tester.files({
      "blue.ts": mockFile.js({ $blue() {} }),
    }).compile(`
      import "./blue.ts";
      @blue
      model A  {}
    `);
    expectFileLoaded(program, { typespec: ["main.tsp"], js: ["blue.ts"] });
  });

  it("import relative TS file in parent folder", async () => {
    const { program } = await Tester.files({
      "blue.ts": mockFile.js({ $blue() {} }),
      "proj/main.tsp": `
      import "../blue.ts";
      @blue
      model A  {}
      `,
    }).compile(`import "./proj/main.tsp";`);
    expectFileLoaded(program, { typespec: ["proj/main.tsp"], js: ["blue.ts"] });
  });

  it("import directory with main.tsp", async () => {
    const { program } = await Tester.files({
      "test/main.tsp": `model C { }`,
    }).compile(`
      import "./test";
      model A { x: C }
    `);
    expectFileLoaded(program, { typespec: ["main.tsp", "test/main.tsp"] });
  });

  it("import library with typespec exports", async () => {
    const { program } = await Tester.files({
      "node_modules/my-lib/package.json": JSON.stringify({
        name: "my-test-lib",
        exports: { ".": { typespec: "./main.tsp" } },
      }),
      "node_modules/my-lib/main.tsp": `model C { }`,
    }).compile(`
      import "my-lib";
      model A { x: C }
    `);
    expectFileLoaded(program, { typespec: ["main.tsp", "node_modules/my-lib/main.tsp"] });
    const file = program.sourceFiles.get(resolveVirtualPath("node_modules/my-lib/main.tsp"));
    ok(file, "File exists");
  });

  it("import library(with tspmain)", async () => {
    const { program } = await Tester.files({
      "node_modules/my-lib/package.json": JSON.stringify({
        name: "my-test-lib",
        tspMain: "./main.tsp",
      }),
      "node_modules/my-lib/main.tsp": `model C { }`,
    }).compile(`
      import "my-lib";
      model A { x: C }
    `);
    expectFileLoaded(program, { typespec: ["main.tsp", "node_modules/my-lib/main.tsp"] });
    const file = program.sourceFiles.get(resolveVirtualPath("node_modules/my-lib/main.tsp"));
    ok(file, "File exists");
  });

  it("emit diagnostic when trying to load invalid relative file", async () => {
    const diagnostics = await Tester.diagnose(`
      import "./doesnotexists";
    `);
    expectDiagnostics(diagnostics, {
      code: "import-not-found",
      message: `Couldn't resolve import "./doesnotexists"`,
    });
  });

  it("emit diagnostic when trying to load invalid library", async () => {
    const diagnostics = await Tester.diagnose(`
      import "@typespec/doesnotexists";
    `);
    expectDiagnostics(diagnostics, {
      code: "import-not-found",
      message: `Couldn't resolve import "@typespec/doesnotexists"`,
    });
  });

  it("emit warning for self-import", async () => {
    const diagnostics = await Tester.diagnose(`
      import "./main.tsp";
      model A { }
    `);
    expectDiagnostics(diagnostics, {
      code: "self-import",
      severity: "warning",
      message: "A file cannot import itself.",
    });
  });

  it("emit warning for duplicate imports", async () => {
    const diagnostics = await Tester.files({
      "b.tsp": `model B { }`,
    }).diagnose(`
      import "./b.tsp";
      import "./b.tsp";
      model A extends B { }
    `);
    expectDiagnostics(diagnostics, {
      code: "duplicate-import",
      severity: "warning",
      message: `Duplicate import of "./b.tsp"`,
    });
  });

  it("emit warning for multiple duplicate imports of the same file", async () => {
    const diagnostics = await Tester.files({
      "b.tsp": `model B { }`,
    }).diagnose(`
      import "./b.tsp";
      import "./b.tsp";
      import "./b.tsp";
      model A extends B { }
    `);
    expectDiagnostics(diagnostics, [
      {
        code: "duplicate-import",
        severity: "warning",
        message: `Duplicate import of "./b.tsp"`,
      },
      {
        code: "duplicate-import",
        severity: "warning",
        message: `Duplicate import of "./b.tsp"`,
      },
    ]);
  });

  it("emit warning for duplicate imports of different files independently", async () => {
    const diagnostics = await Tester.files({
      "b.tsp": `model B { }`,
      "c.tsp": `model C { }`,
    }).diagnose(`
      import "./b.tsp";
      import "./c.tsp";
      import "./b.tsp";
      import "./c.tsp";
      model A extends B { }
    `);
    expectDiagnostics(diagnostics, [
      {
        code: "duplicate-import",
        severity: "warning",
        message: `Duplicate import of "./b.tsp"`,
      },
      {
        code: "duplicate-import",
        severity: "warning",
        message: `Duplicate import of "./c.tsp"`,
      },
    ]);
  });

  it("emit warning only for duplicates when mixed with other imports", async () => {
    const diagnostics = await Tester.files({
      "b.tsp": `model B { }`,
      "c.tsp": `model C { }`,
    }).diagnose(`
      import "./b.tsp";
      import "./c.tsp";
      import "./b.tsp";
      model A extends B { }
    `);
    expectDiagnostics(diagnostics, [
      {
        code: "duplicate-import",
        severity: "warning",
        message: `Duplicate import of "./b.tsp"`,
      },
    ]);
  });

  it("emit self-import warning alongside other valid imports", async () => {
    const diagnostics = await Tester.files({
      "b.tsp": `model B { }`,
    }).diagnose(`
      import "./b.tsp";
      import "./main.tsp";
      model A extends B { }
    `);
    expectDiagnostics(diagnostics, [
      {
        code: "self-import",
        severity: "warning",
        message: "A file cannot import itself.",
      },
    ]);
  });

  // We don't need to create extra noise
  it("self-import is not counted as duplicate", async () => {
    const diagnostics = await Tester.files({
      "b.tsp": `model B { }`,
    }).diagnose(`
      import "./main.tsp";
      import "./main.tsp";
      import "./b.tsp";
      model A extends B { }
    `);
    expectDiagnostics(diagnostics, [
      {
        code: "self-import",
        severity: "warning",
      },
      {
        code: "self-import",
        severity: "warning",
      },
    ]);
  });

  it("does not emit duplicate warning for different paths to the same file", async () => {
    const diagnostics = await Tester.files({
      "b.tsp": `model B { }`,
    }).diagnose(`
      import "./b.tsp";
      import "./sub/../b.tsp";
      model A extends B { }
    `);
    expectDiagnostics(diagnostics, []);
  });

  describe("import scopes", () => {
    interface ScopeTest<T extends Structure> {
      readonly structure: T;
      readonly entrypoint: string;
    }

    type TspFile = `${string}.tsp`;
    type PkgJson = `${string}package.json`;

    interface Structure {
      [key: TspFile]: string[];
      [key: PkgJson]: Partial<PackageJson>;
    }

    interface ScopeExpectation<T extends Structure> {
      expectScopes(scopes: Record<keyof T & TspFile, LocationContext>): Promise<void>;
    }

    function givenStructure<T extends Structure>(config: ScopeTest<T>): ScopeExpectation<T> {
      return {
        expectScopes: async (scopes: Record<keyof T, LocationContext>) => {
          const filesMap: Record<string, string> = {};
          for (const [filename, fileConfig] of Object.entries(config.structure)) {
            if (filename.endsWith(".tsp")) {
              filesMap[filename] = (fileConfig as string[]).map((x) => `import "${x}";`).join("\n");
            } else {
              filesMap[filename] = JSON.stringify(fileConfig, null, 2);
            }
          }

          const { program } = await Tester.files(filesMap).compile(
            `import "./${config.entrypoint}";`,
          );
          for (const [filename, expectedScope] of Object.entries(scopes)) {
            const file = program.sourceFiles.get(resolveVirtualPath(filename));
            ok(file, `Expected to have file "${filename}"`);
            deepStrictEqual(program.getSourceFileLocationContext(file.file), expectedScope);
          }
        },
      };
    }

    function libraryScope(data: Omit<ModuleLibraryMetadata, "type">): LibraryLocationContext {
      return {
        type: "library",
        metadata: { type: "module", ...data },
      };
    }

    const projectScope: ProjectLocationContext = { type: "project" };
    it("relative files are stays in project", async () => {
      await givenStructure({
        entrypoint: "my-project/main.tsp",
        structure: {
          "my-project/main.tsp": ["./other.tsp", "../common.tsp"],
          "my-project/other.tsp": [],
          "common.tsp": [],
        },
      }).expectScopes({
        "my-project/main.tsp": projectScope,
        "my-project/other.tsp": projectScope,
        "common.tsp": projectScope,
      });
    });

    it("importing a library resolve is as its library", async () => {
      await givenStructure({
        entrypoint: "my-project/main.tsp",
        structure: {
          "my-project/main.tsp": ["my-lib1", "my-lib2"],
          "node_modules/my-lib1/package.json": {
            name: "my-lib1",
            tspMain: "./main.tsp",
          },
          "node_modules/my-lib1/main.tsp": [],
          "node_modules/my-lib2/package.json": {
            name: "my-lib2",
            tspMain: "./main.tsp",
          },
          "node_modules/my-lib2/main.tsp": [],
        },
      }).expectScopes({
        "my-project/main.tsp": projectScope,
        "node_modules/my-lib1/main.tsp": libraryScope({ name: "my-lib1" }),
        "node_modules/my-lib2/main.tsp": libraryScope({ name: "my-lib2" }),
      });
    });

    it("library importing another library resolve each as their own scope", async () => {
      await givenStructure({
        entrypoint: "my-project/main.tsp",
        structure: {
          "my-project/main.tsp": ["my-lib1"],
          "node_modules/my-lib1/package.json": {
            name: "my-lib1",
            tspMain: "./main.tsp",
          },
          "node_modules/my-lib1/main.tsp": ["my-lib2"],
          "node_modules/my-lib2/package.json": {
            name: "my-lib2",
            tspMain: "./main.tsp",
          },
          "node_modules/my-lib2/main.tsp": [],
        },
      }).expectScopes({
        "my-project/main.tsp": projectScope,
        "node_modules/my-lib1/main.tsp": libraryScope({ name: "my-lib1" }),
        "node_modules/my-lib2/main.tsp": libraryScope({ name: "my-lib2" }),
      });
    });

    describe("if a file is imported from main project and library, FIRST loaded wins...", () => {
      it("loading via lib first", async () => {
        await givenStructure({
          entrypoint: "my-project/main.tsp",
          structure: {
            "my-project/main.tsp": ["./my-lib1", "./common.tsp"],
            "my-project/my-lib1/package.json": {
              name: "my-lib1",
              tspMain: "./main.tsp",
            },
            "my-project/my-lib1/main.tsp": ["../common.tsp"],
            "my-project/common.tsp": [],
          },
        }).expectScopes({
          "my-project/main.tsp": projectScope,
          "my-project/my-lib1/main.tsp": libraryScope({ name: "my-lib1" }),
          "my-project/common.tsp": libraryScope({ name: "my-lib1" }),
        });
      });

      it("loading via project first", async () => {
        await givenStructure({
          entrypoint: "my-project/main.tsp",
          structure: {
            "my-project/main.tsp": ["./common.tsp", "./my-lib1"],
            "my-project/my-lib1/package.json": {
              name: "my-lib1",
              tspMain: "./main.tsp",
            },
            "my-project/my-lib1/main.tsp": ["../common.tsp"],
            "my-project/common.tsp": [],
          },
        }).expectScopes({
          "my-project/main.tsp": projectScope,
          "my-project/my-lib1/main.tsp": libraryScope({ name: "my-lib1" }),
          "my-project/common.tsp": projectScope,
        });
      });
    });
  });
});
