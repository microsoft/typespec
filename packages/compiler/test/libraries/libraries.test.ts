import { describe, it } from "vitest";
import { NodeHost } from "../../src/core/node-host.js";
import { compile } from "../../src/core/program.js";
import { resolvePath } from "../../src/index.js";
import { MANIFEST } from "../../src/manifest.js";
import {
  expectDiagnosticEmpty,
  expectDiagnostics,
  findTestPackageRoot,
  mockFile,
  resolveVirtualPath,
} from "../../src/testing/index.js";
import { Tester } from "../tester.js";

const libs = [
  "simple", // Load a library in `node_modules`
  "library-dev/samples", // Load library defined in parent folder.
];

const pkgRoot = await findTestPackageRoot(import.meta.url);
describe("compiler: libraries", () => {
  for (const lib of libs) {
    describe(lib, () => {
      it("compiles without error", async () => {
        const mainFile = resolvePath(pkgRoot, `test/libraries/${lib}/main.tsp`);
        const program = await compile(NodeHost, mainFile, { noEmit: true });
        expectDiagnosticEmpty(program.diagnostics);
      });
    });
  }

  it("detects compiler version mismatches", async () => {
    const instance = await Tester.files({
      "other/main.tsp": "",
      "./other/node_modules/@typespec/compiler/package.json": JSON.stringify({
        name: "@typespec/compiler",
        main: "index.js",
        version: "0.1.0-notthesame.1",
      }),
      "./other/node_modules/@typespec/compiler/index.js": mockFile.js({}),
    }).createInstance();
    // Add test-lib placeholder (normally added internally by Tester.diagnose)
    instance.fs.addTypeSpecFile("./node_modules/@typespec/compiler/test-lib/main.tsp", "");
    const program = await compile(instance.fs.compilerHost, resolveVirtualPath("other/main.tsp"));
    expectDiagnostics(program.diagnostics, {
      code: "compiler-version-mismatch",
      severity: "warning",
      message: /Current TypeSpec compiler conflicts with local version/,
    });
  });

  it("allows compiler install to mismatch if the version are the same", async () => {
    const diagnostics = await Tester.files({
      "./node_modules/@typespec/compiler/package.json": JSON.stringify({
        name: "@typespec/compiler",
        main: "index.js",
        version: MANIFEST.version,
      }),
      "./node_modules/@typespec/compiler/index.js": mockFile.js({}),
    }).diagnose("");
    expectDiagnosticEmpty(diagnostics);
  });

  it("report errors in js files", async () => {
    const diagnostics = await Tester.files({
      "lib1.js": mockFile.js({ $myDec: () => null }),
      "lib2.js": mockFile.js({ $myDec: () => null }),
    }).diagnose(`
    import "./lib1.js";
    import "./lib2.js";
    `);
    expectDiagnostics(diagnostics, [
      {
        code: "duplicate-symbol",
        message: `Duplicate name: "@myDec"`,
        file: "lib1.js",
      },
      {
        code: "duplicate-symbol",
        message: `Duplicate name: "@myDec"`,
        file: "lib2.js",
      },
    ]);
  });
});
