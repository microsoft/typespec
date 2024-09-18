import { deepStrictEqual, ok } from "assert";
import { beforeEach, describe, it } from "vitest";
import {
  LibraryLocationContext,
  LocationContext,
  ModuleLibraryMetadata,
  NodePackage,
  ProjectLocationContext,
} from "../../src/core/index.js";
import {
  TestHost,
  createTestHost,
  expectDiagnostics,
  resolveVirtualPath,
} from "../../src/testing/index.js";

describe("compiler: imports", () => {
  let host: TestHost;

  beforeEach(async () => {
    host = await createTestHost();
  });

  function expectFileLoaded(files: { typespec?: string[]; js?: string[] }) {
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
        expectFileIn(file, host.program.sourceFiles);
      }
    }
    if (files.js) {
      for (const file of files.js) {
        expectFileIn(file, host.program.jsSourceFiles);
      }
    }
  }

  it("import relative TypeSpec file", async () => {
    host.addJsFile("blue.js", { $blue() {} });
    host.addTypeSpecFile(
      "main.tsp",
      `
      import "./b.tsp";
      model A extends B { }
      `,
    );
    host.addTypeSpecFile(
      "b.tsp",
      `
      model B { }
      `,
    );
    await host.compile("main.tsp");
    expectFileLoaded({ typespec: ["main.tsp", "b.tsp"] });
  });

  it("import relative JS file", async () => {
    host.addJsFile("blue.js", { $blue() {} });
    host.addTypeSpecFile(
      "main.tsp",
      `
      import "./blue.js";

      @blue
      model A  {}
      `,
    );
    await host.compile("main.tsp");
    expectFileLoaded({ typespec: ["main.tsp"], js: ["blue.js"] });
  });

  it("import relative JS file in parent folder", async () => {
    host.addJsFile("blue.js", { $blue() {} });
    host.addTypeSpecFile(
      "proj/main.tsp",
      `
      import "../blue.js";

      @blue
      model A  {}
      `,
    );
    await host.compile("proj/main.tsp");
    expectFileLoaded({ typespec: ["proj/main.tsp"], js: ["blue.js"] });
  });

  it("import directory with main.tsp", async () => {
    host.addTypeSpecFile(
      "main.tsp",
      `
      import "./test";

      model A { x: C }
      `,
    );
    host.addTypeSpecFile(
      "test/main.tsp",
      `
      model C { }
      `,
    );

    await host.compile("main.tsp");
    expectFileLoaded({ typespec: ["main.tsp", "test/main.tsp"] });
  });

  it("import library", async () => {
    host.addTypeSpecFile(
      "main.tsp",
      `
      import "my-lib";

      model A { x: C }
      `,
    );
    host.addTypeSpecFile(
      "node_modules/my-lib/package.json",
      JSON.stringify({
        name: "my-test-lib",
        tspMain: "./main.tsp",
      }),
    );
    host.addTypeSpecFile(
      "node_modules/my-lib/main.tsp",
      `
      model C { }
      `,
    );

    await host.compile("main.tsp");
    expectFileLoaded({ typespec: ["main.tsp", "node_modules/my-lib/main.tsp"] });
    const file = host.program.sourceFiles.get(resolveVirtualPath("node_modules/my-lib/main.tsp"));
    ok(file, "File exists");
  });

  it("emit diagnostic when trying to load invalid relative file", async () => {
    host.addTypeSpecFile(
      "main.tsp",
      `
      import "./doesnotexists";
      `,
    );

    const diagnostics = await host.diagnose("main.tsp");
    expectDiagnostics(diagnostics, {
      code: "import-not-found",
      message: `Couldn't resolve import "./doesnotexists"`,
    });
  });

  it("emit diagnostic when trying to load invalid library", async () => {
    host.addTypeSpecFile(
      "main.tsp",
      `
      import "@typespec/doesnotexists";
      `,
    );

    const diagnostics = await host.diagnose("main.tsp");
    expectDiagnostics(diagnostics, {
      code: "import-not-found",
      message: `Couldn't resolve import "@typespec/doesnotexists"`,
    });
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
      [key: PkgJson]: Partial<NodePackage>;
    }

    interface ScopeExpectation<T extends Structure> {
      expectScopes(scopes: Record<keyof T & TspFile, LocationContext>): Promise<void>;
    }

    function givenStructure<T extends Structure>(config: ScopeTest<T>): ScopeExpectation<T> {
      return {
        expectScopes: async (scopes: Record<keyof T, LocationContext>) => {
          for (const [filename, fileConfig] of Object.entries(config.structure)) {
            if (filename.endsWith(".tsp")) {
              host.addTypeSpecFile(
                filename,
                (fileConfig as string[]).map((x) => `import "${x}";`).join("\n"),
              );
            } else {
              host.addTypeSpecFile(filename, JSON.stringify(fileConfig, null, 2));
            }
          }

          await host.compile(config.entrypoint);
          for (const [filename, expectedScope] of Object.entries(scopes)) {
            const file = host.program.sourceFiles.get(resolveVirtualPath(filename));
            ok(file, `Expected to have file "${filename}"`);
            deepStrictEqual(host.program.getSourceFileLocationContext(file.file), expectedScope);
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
