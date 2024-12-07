import { beforeEach, describe, it } from "vitest";
import { createTypeSpecLibrary } from "../../src/index.js";
import {
  createTestHost,
  expectDiagnosticEmpty,
  expectDiagnostics,
  TestHost,
} from "../../src/testing/index.js";

describe("compiler: unused imports", () => {
  let host: TestHost;

  beforeEach(async () => {
    host = await createTestHost({ checkUnnecessaryDiagnostics: true });
  });

  it("no unused diagnostic for import file with usage", async () => {
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

    const diagnostics = await host.diagnose("main.tsp");
    expectDiagnosticEmpty(diagnostics);
  });

  it("unused diagnostic for import file without usage", async () => {
    host.addJsFile("blue.js", { $blue() {} });
    host.addTypeSpecFile(
      "main.tsp",
      `
      import "./b.tsp";
      `,
    );
    host.addTypeSpecFile(
      "b.tsp",
      `
      model B { }
      `,
    );

    const diagnostics = await host.diagnose("main.tsp");
    expectDiagnostics(diagnostics, [
      {
        code: "unused-import",
        message: `Unused import: import "./b.tsp"`,
        severity: "hint",
      },
    ]);
  });

  it("no unused diagnostic for import file with reference from template", async () => {
    host.addJsFile("blue.js", { $blue() {} });
    host.addTypeSpecFile(
      "main.tsp",
      `
      import "./b.tsp";
      model A<T extends B> { }
      `,
    );
    host.addTypeSpecFile(
      "b.tsp",
      `
      model B { }
      `,
    );

    const diagnostics = await host.diagnose("main.tsp");
    expectDiagnosticEmpty(diagnostics);
  });

  it("no unused diagnostic for import JS file with decorator usage", async () => {
    host.addJsFile("blue.js", { $blue() {} });
    host.addTypeSpecFile(
      "main.tsp",
      `
      import "./blue.js";

      @blue
      model A  {}
      `,
    );

    const diagnostics = await host.diagnose("main.tsp");
    expectDiagnosticEmpty(diagnostics);
  });

  it("unused diagnostic for import JS file without usage", async () => {
    host.addJsFile("blue.js", { $blue() {} });
    host.addTypeSpecFile(
      "main.tsp",
      `
      import "./blue.js";

      model A  {}
      `,
    );

    const diagnostics = await host.diagnose("main.tsp");
    expectDiagnostics(diagnostics, [
      {
        code: "unused-import",
        message: `Unused import: import "./blue.js"`,
        severity: "hint",
      },
    ]);
  });

  it("no unused diagnostic for import file with indirect usage", async () => {
    host.addJsFile("blue.js", { $blue() {} });
    host.addTypeSpecFile(
      "main.tsp",
      `
      import "./b.tsp";
      import "./c.tsp";
      model A extends B { }
      `,
    );
    host.addTypeSpecFile(
      "b.tsp",
      `
      model B extends C{ }
      `,
    );
    host.addTypeSpecFile(
      "c.tsp",
      `
      model C { };
      `,
    );

    const diagnostics = await host.diagnose("main.tsp");
    expectDiagnosticEmpty(diagnostics);
  });

  it("no unused diagnostic for multiple import file with usage", async () => {
    host.addJsFile("blue.js", { $blue() {} });
    host.addTypeSpecFile(
      "main.tsp",
      `
      import "./b.tsp";
      import "./c.tsp";
      import "./blue.js";
      model A extends B { }
      @blue
      model A2 extends C { }
      `,
    );
    host.addTypeSpecFile(
      "b.tsp",
      `
      model B { }
      `,
    );
    host.addTypeSpecFile(
      "c.tsp",
      `
      model C { };
      `,
    );

    const diagnostics = await host.diagnose("main.tsp");
    expectDiagnosticEmpty(diagnostics);
  });

  it("unused diagnostic for C when Main->B, C->B", async () => {
    host.addJsFile("blue.js", { $blue() {} });
    host.addTypeSpecFile(
      "main.tsp",
      `
      import "./b.tsp";
      import "./c.tsp";
      model A extends B { }
      `,
    );
    host.addTypeSpecFile(
      "b.tsp",
      `
      model B { }
      `,
    );
    host.addTypeSpecFile(
      "c.tsp",
      `
      model C extends B { };
      `,
    );

    const diagnostics = await host.diagnose("main.tsp");
    expectDiagnostics(diagnostics, [
      {
        code: "unused-import",
        message: `Unused import: import "./c.tsp"`,
        severity: "hint",
      },
    ]);
  });

  it("unused diagnostic for C when Main->B, C->D", async () => {
    host.addJsFile("blue.js", { $blue() {} });
    host.addTypeSpecFile(
      "main.tsp",
      `
      import "./b.tsp";
      import "./c.tsp";
      import "./d.tsp";
      model A extends B { }
      `,
    );
    host.addTypeSpecFile(
      "b.tsp",
      `
      model B { }
      `,
    );
    host.addTypeSpecFile(
      "c.tsp",
      `
      model C extends D { };
      `,
    );
    host.addTypeSpecFile(
      "d.tsp",
      `
      model D { }
      `,
    );

    const diagnostics = await host.diagnose("main.tsp");
    expectDiagnostics(diagnostics, [
      {
        code: "unused-import",
        message: `Unused import: import "./c.tsp"`,
        severity: "hint",
      },
      {
        code: "unused-import",
        message: `Unused import: import "./d.tsp"`,
        severity: "hint",
      },
    ]);
  });

  it("unused diagnostic for import directory without usage", async () => {
    host.addTypeSpecFile(
      "main.tsp",
      `
      import "./test";

      model A { x: int16 }
      `,
    );
    host.addTypeSpecFile(
      "test/main.tsp",
      `
      model C { }
      `,
    );

    const diagnostics = await host.diagnose("main.tsp");
    expectDiagnostics(diagnostics, [
      {
        code: "unused-import",
        message: `Unused import: import "./test"`,
        severity: "hint",
      },
    ]);
  });

  it("no unused diagnostic for import directory with usage & unused import in lib", async () => {
    host.addTypeSpecFile(
      "main.tsp",
      `
      import "./test";

      model A extends DirA { x: C }
      `,
    );
    host.addTypeSpecFile(
      "test/main.tsp",
      `
      import "./dir-a.tsp";
      model C { }
      `,
    );
    host.addTypeSpecFile(
      "test/dir-a.tsp",
      `
      model DirA { }
      `,
    );

    const diagnostics = await host.diagnose("main.tsp");
    expectDiagnosticEmpty(diagnostics);
  });

  it("unused import library", async () => {
    host.addTypeSpecFile(
      "main.tsp",
      `
      import "my-lib";

      model A { x: int16 }
      `,
    );
    host.addTypeSpecFile(
      "node_modules/my-lib/package.json",
      JSON.stringify({
        name: "my-test-lib",
        exports: { ".": { typespec: "./main.tsp" } },
      }),
    );
    host.addTypeSpecFile(
      "node_modules/my-lib/main.tsp",
      `
      model C { }
      `,
    );

    const diagnostics = await host.diagnose("main.tsp");
    expectDiagnostics(diagnostics, [
      {
        code: "unused-import",
        message: `Unused import: import "my-lib"`,
        severity: "hint",
      },
    ]);
  });

  it("unused import library but required by emitter", async () => {
    host.addTypeSpecFile(
      "main.tsp",
      `
      import "my-lib";

      model A { x: int16 }
      `,
    );
    host.addTypeSpecFile(
      "node_modules/my-lib/package.json",
      JSON.stringify({
        name: "my-lib",
        exports: { ".": { typespec: "./main.tsp" } },
      }),
    );
    host.addTypeSpecFile(
      "node_modules/my-lib/main.tsp",
      `
      model C { }
      `,
    );
    host.addTypeSpecFile(
      "node_modules/fake-emitter/package.json",
      JSON.stringify({
        main: "index.js",
      }),
    );
    const fakeEmitter = createTypeSpecLibrary({
      name: "fake-emitter",
      diagnostics: {},
      requireImports: ["my-lib"],
      emitter: {
        options: {
          type: "object",
          properties: {
            "asset-dir": { type: "string", format: "absolute-path", nullable: true },
            "max-files": { type: "number", nullable: true },
          },
          additionalProperties: false,
        },
      },
    });
    host.addJsFile("node_modules/fake-emitter/index.js", {
      $lib: fakeEmitter,
      $onEmit: () => {},
    });

    const diagnostics = await host.diagnose("main.tsp", {
      emit: ["fake-emitter"],
    });
    expectDiagnosticEmpty(diagnostics);
  });

  it("no unused import library when there is one ref", async () => {
    host.addTypeSpecFile(
      "main.tsp",
      `
      import "my-lib";
      
      model B { x: LibA.A }
      `,
    );
    host.addTypeSpecFile(
      "node_modules/my-lib/package.json",
      JSON.stringify({
        name: "my-test-lib",
        exports: { ".": { typespec: "./main.tsp" } },
      }),
    );
    host.addTypeSpecFile(
      "node_modules/my-lib/main.tsp",
      `
      import "./lib-a.tsp";
      using LibA;
      model C extends A { }
      `,
    );
    host.addTypeSpecFile(
      "node_modules/my-lib/lib-a.tsp",
      `
      namespace LibA;
      model A { x: int16 }
      `,
    );

    const diagnostics = await host.diagnose("main.tsp");
    expectDiagnosticEmpty(diagnostics);
  });

  it("no unused import library when there is one using even when it's not used", async () => {
    host.addTypeSpecFile(
      "main.tsp",
      `
      import "my-lib";
      using LibA;
      model B { x: int32 }
      `,
    );
    host.addTypeSpecFile(
      "node_modules/my-lib/package.json",
      JSON.stringify({
        name: "my-test-lib",
        exports: { ".": { typespec: "./main.tsp" } },
      }),
    );
    host.addTypeSpecFile(
      "node_modules/my-lib/main.tsp",
      `
      import "./lib-a.tsp";
      using LibA;
      model C extends A { }
      `,
    );
    host.addTypeSpecFile(
      "node_modules/my-lib/lib-a.tsp",
      `
      namespace LibA;
      model A { x: int16 }
      `,
    );

    const diagnostics = await host.diagnose("main.tsp");
    expectDiagnostics(diagnostics, [
      {
        code: "unused-using",
        message: `Unused using: using LibA`,
        severity: "hint",
      },
    ]);
  });

  it("no unused import library when there is one ref through using", async () => {
    host.addTypeSpecFile(
      "main.tsp",
      `
      import "my-lib";
      using LibA;
      model B { x: A }
      `,
    );
    host.addTypeSpecFile(
      "node_modules/my-lib/package.json",
      JSON.stringify({
        name: "my-test-lib",
        exports: { ".": { typespec: "./main.tsp" } },
      }),
    );
    host.addTypeSpecFile(
      "node_modules/my-lib/main.tsp",
      `
      import "./lib-a.tsp";
      using LibA;
      model C { }
      `,
    );
    host.addTypeSpecFile(
      "node_modules/my-lib/lib-a.tsp",
      `
      namespace LibA;
      model A { x: int16 }
      `,
    );

    const diagnostics = await host.diagnose("main.tsp");
    expectDiagnosticEmpty(diagnostics);
  });

  it("unused diagnostic for multiple import to one file", async () => {
    host.addJsFile("blue.js", { $blue() {} });
    host.addTypeSpecFile(
      "main.tsp",
      `
      import "./b.tsp";
      import "./c.tsp";
      import "./blue.js";
      @blue
      model A extends B { }
      `,
    );
    host.addTypeSpecFile(
      "b.tsp",
      `
      import "./c.tsp";
      import "./blue.js";
      model B { }
      `,
    );
    host.addTypeSpecFile(
      "c.tsp",
      `
      @blue
      model C { };
      `,
    );

    const diagnostics = await host.diagnose("main.tsp");
    expectDiagnostics(diagnostics, [
      {
        code: "unused-import",
        message: `Unused import: import "./c.tsp"`,
        severity: "hint",
      },
      {
        code: "unused-import",
        message: `Unused import: import "./c.tsp"`,
        severity: "hint",
      },
    ]);
  });

  it("no unused diagnostic Main -> B & C & D, B -> C, D ref C", async () => {
    host.addJsFile("blue.js", { $blue() {} });
    host.addTypeSpecFile(
      "main.tsp",
      `
      import "./b.tsp";
      import "./c.tsp";
      import "./d.tsp";
      import "./blue.js";
      @blue
      model A extends D { }
      model AA extends B { }
      `,
    );
    host.addTypeSpecFile(
      "b.tsp",
      `
      import "./c.tsp";
      import "./blue.js";

      model B { }
      `,
    );
    host.addTypeSpecFile(
      "c.tsp",
      `
      @blue
      model C { };
      `,
    );
    host.addTypeSpecFile(
      "d.tsp",
      `
      model D extends C { };
      `,
    );

    const diagnostics = await host.diagnose("main.tsp");
    expectDiagnosticEmpty(diagnostics);
  });

  it("unused diagnostic Main -> B & C & D, B -> C, D ref C, Main no-ref D", async () => {
    host.addJsFile("blue.js", { $blue() {} });
    host.addTypeSpecFile(
      "main.tsp",
      `
      import "./b.tsp";
      import "./c.tsp";
      import "./d.tsp";
      import "./blue.js";
      @blue
      model A extends B { }
      model AA extends B { }
      `,
    );
    host.addTypeSpecFile(
      "b.tsp",
      `
      import "./c.tsp";
      import "./blue.js";

      model B { }
      `,
    );
    host.addTypeSpecFile(
      "c.tsp",
      `
      @blue
      model C { };
      `,
    );
    host.addTypeSpecFile(
      "d.tsp",
      `
      model D extends C { };
      `,
    );

    const diagnostics = await host.diagnose("main.tsp");
    expectDiagnostics(diagnostics, [
      {
        code: "unused-import",
        message: `Unused import: import "./c.tsp"`,
        severity: "hint",
      },
      {
        code: "unused-import",
        message: `Unused import: import "./c.tsp"`,
        severity: "hint",
      },
      {
        code: "unused-import",
        message: `Unused import: import "./d.tsp"`,
        severity: "hint",
      },
    ]);
  });

  it("no unused diagnostic Main -> B -> C -> D, Main ref D", async () => {
    host.addJsFile("blue.js", { $blue() {} });
    host.addTypeSpecFile(
      "main.tsp",
      `
      import "./b.tsp";
      model AA extends D { }
      `,
    );
    host.addTypeSpecFile(
      "b.tsp",
      `
      import "./c.tsp";
      `,
    );
    host.addTypeSpecFile(
      "c.tsp",
      `
      import "./d.tsp";
      `,
    );
    host.addTypeSpecFile(
      "d.tsp",
      `
      model D { };
      `,
    );

    const diagnostics = await host.diagnose("main.tsp");
    expectDiagnosticEmpty(diagnostics);
  });

  it("unused diagnostic Main -> B -> C -> D and Main -> C, Main ref D", async () => {
    host.addJsFile("blue.js", { $blue() {} });
    host.addTypeSpecFile(
      "main.tsp",
      `
      import "./b.tsp";
      import "./c.tsp";
      model AA extends D { }
      `,
    );
    host.addTypeSpecFile(
      "b.tsp",
      `
      import "./c.tsp";
      `,
    );
    host.addTypeSpecFile(
      "c.tsp",
      `
      import "./d.tsp";
      `,
    );
    host.addTypeSpecFile(
      "d.tsp",
      `
      model D { };
      `,
    );

    const diagnostics = await host.diagnose("main.tsp");
    expectDiagnostics(diagnostics, [
      {
        code: "unused-import",
        message: `Unused import: import "./b.tsp"`,
        severity: "hint",
      },
    ]);
  });

  it("no unused diagnostic Main -> B & C, Main ref C through Alias in B", async () => {
    host.addJsFile("blue.js", { $blue() {} });
    host.addTypeSpecFile(
      "main.tsp",
      `
      import "./b.tsp";
      import "./c.tsp";
      model AA extends AliasC { }
      `,
    );
    host.addTypeSpecFile(
      "b.tsp",
      `
      alias AliasC = C;
      `,
    );
    host.addTypeSpecFile(
      "c.tsp",
      `
      model C { };
      `,
    );

    const diagnostics = await host.diagnose("main.tsp");
    expectDiagnosticEmpty(diagnostics);
  });

  it("no unused diagnostic when referenced in same namespace", async () => {
    host.addJsFile("blue.js", { $blue() {} });
    host.addTypeSpecFile(
      "main.tsp",
      `
      import "./a.tsp";
      import "./b.tsp";
      namespace N {
        model M extends B {}
      }
      `,
    );
    host.addTypeSpecFile(
      "a.tsp",
      `
      namespace N {
        model A {}
      }
      `,
    );
    host.addTypeSpecFile(
      "b.tsp",
      `
      namespace N {
        model B extends A {}
      }
      `,
    );

    const diagnostics = await host.diagnose("main.tsp");
    expectDiagnosticEmpty(diagnostics);
  });

  it("no unused diagnostic when referenced in same namespace (blockless)", async () => {
    host.addJsFile("blue.js", { $blue() {} });
    host.addTypeSpecFile(
      "main.tsp",
      `
      import "./a.tsp";
      import "./b.tsp";
      namespace N;
      model M extends B {}
      `,
    );
    host.addTypeSpecFile(
      "a.tsp",
      `
      namespace N;
      model A {};
      `,
    );
    host.addTypeSpecFile(
      "b.tsp",
      `
      namespace N;
      model B extends A {}
      `,
    );

    const diagnostics = await host.diagnose("main.tsp");
    expectDiagnosticEmpty(diagnostics);
  });

  it("no unused diagnostic when referenced in same namespace (blockless with un-blockless)", async () => {
    host.addJsFile("blue.js", { $blue() {} });
    host.addTypeSpecFile(
      "main.tsp",
      `
      import "./a.tsp";
      import "./b.tsp";
      namespace N;
      model M extends B {}
      `,
    );
    host.addTypeSpecFile(
      "a.tsp",
      `
      namespace N;
      model A {};
      `,
    );
    host.addTypeSpecFile(
      "b.tsp",
      `
      namespace N {
        model B extends A {}
      }
      `,
    );

    const diagnostics = await host.diagnose("main.tsp");
    expectDiagnosticEmpty(diagnostics);
  });

  it("check with old program", async () => {
    host.addJsFile("blue.js", { $blue() {} });
    host.addTypeSpecFile(
      "main.tsp",
      `
      import "./a.tsp";
      import "./b.tsp";
      import "./blue.js";
      namespace N;
      model M extends B {}
      `,
    );
    host.addTypeSpecFile(
      "a.tsp",
      `
      namespace N;
      model A {};
      `,
    );
    host.addTypeSpecFile(
      "b.tsp",
      `
      namespace N {
        @blue()
        model B {}
      }
      `,
    );

    const oldProgram = await host.compileWithProgram("main.tsp");
    expectDiagnostics(oldProgram.diagnostics, [
      {
        code: "unused-import",
        message: `Unused import: import "./a.tsp"`,
        severity: "hint",
      },
    ]);
    const p = await host.compileWithProgram("main.tsp", undefined, oldProgram);
    expectDiagnostics(p.diagnostics, [
      {
        code: "unused-import",
        message: `Unused import: import "./a.tsp"`,
        severity: "hint",
      },
    ]);
  });

  it("import in circle won't cause problem. Main -> a.tsp <-> b.tsp -> b2.tsp -> b.tsp, Main -> c.tsp -> d.tsp -> e.tsp -> c.tsp & b.tsp", async () => {
    host.addJsFile("blue.js", { $blue() {} });
    host.addTypeSpecFile(
      "main.tsp",
      `
      import "./a.tsp";
      import "./c.tsp";
      model BEx {...B2, ...B2Alias}
      `,
    );
    host.addTypeSpecFile(
      "a.tsp",
      `
      import "./b.tsp";
      `,
    );
    host.addTypeSpecFile(
      "b.tsp",
      `
      import "./b2.tsp";
      import "./a.tsp";
      model B {}
      `,
    );
    host.addTypeSpecFile(
      "b2.tsp",
      `
      import "./b.tsp";
      model B2 {}
      `,
    );
    host.addTypeSpecFile(
      "c.tsp",
      `
      import "./d.tsp";
      `,
    );
    host.addTypeSpecFile(
      "d.tsp",
      `
      import "./e.tsp";
      `,
    );
    host.addTypeSpecFile(
      "e.tsp",
      `
      import "./b.tsp";
      import "./c.tsp";
      
      alias B2Alias = B2;
      `,
    );

    const diagnostics = await host.diagnose("main.tsp");
    expectDiagnosticEmpty(diagnostics);
  });

  it("import in circle won't cause problem. Main -> a.tsp <-> b.tsp -> c.tsp -> d.tsp, b.tsp <-> e.tsp <-> d.tsp, Main ref d's model", async () => {
    host.addJsFile("blue.js", { $blue() {} });
    host.addTypeSpecFile(
      "main.tsp",
      `
      import "./a.tsp";
      model M { ...D }
      `,
    );
    host.addTypeSpecFile(
      "a.tsp",
      `
      import "./b.tsp";
      `,
    );
    host.addTypeSpecFile(
      "b.tsp",
      `
      import "./a.tsp";
      import "./c.tsp";
      import "./e.tsp";
      `,
    );
    host.addTypeSpecFile(
      "c.tsp",
      `
      import "./d.tsp";
      `,
    );
    host.addTypeSpecFile(
      "d.tsp",
      `
      import "./e.tsp";
      model D {}
      `,
    );
    host.addTypeSpecFile(
      "e.tsp",
      `
      import "./b.tsp";
      import "./d.tsp";
      `,
    );

    const diagnostics = await host.diagnose("main.tsp");
    expectDiagnostics(diagnostics, [
      {
        code: "unused-import",
        message: `Unused import: import "./c.tsp"`,
        severity: "hint",
      },
    ]);
  });

  it("import from cli won't be counted as not needed", async () => {
    host.addJsFile("blue.js", { $blue() {} });
    host.addTypeSpecFile(
      "main.tsp",
      `
        model Main {}
      `,
    );
    host.addTypeSpecFile(
      "a.tsp",
      `
        import "./b.tsp";
        model A extends B {}
      `,
    );
    host.addTypeSpecFile(
      "b.tsp",
      `
        import "./c.tsp";
        model B {}
      `,
    );
    host.addTypeSpecFile(
      "c.tsp",
      `
        model C {}
      `,
    );

    const [_, diagnostics] = await host.compileAndDiagnose("main.tsp", {
      additionalImports: ["./a.tsp"],
    });
    expectDiagnostics(diagnostics, [
      {
        code: "unused-import",
        message: `Unused import: import "./c.tsp"`,
        severity: "hint",
      },
    ]);
  });
});
