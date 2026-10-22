import * as compiler from "@typespec/compiler";
import { createTester, resolveVirtualPath, type TestFileSystem } from "@typespec/compiler/testing";
import { beforeEach, expect, it } from "vitest";
import { compileScenario } from "../src/spec-utils/compile-scenario.js";

const tester = createTester(compiler.resolvePath(import.meta.dirname, ".."), { libraries: [] });
let fs: TestFileSystem;
let testCompiler: typeof compiler;
const mainFile = resolveVirtualPath("main.tsp");

beforeEach(async () => {
  fs = (await tester.createInstance()).fs;
  testCompiler = {
    ...compiler,
    NodeHost: {
      ...fs.compilerHost,
      getLibDirs: () => [resolveVirtualPath("node_modules/@typespec/compiler/lib/std")],
    },
  };
});

const unionSpec = `
  model Base { name: string; }
  model Child extends Base {}
  union Example extends Base { child: Child }
`;

it("honors scenario project feature flags", async () => {
  fs.add("main.tsp", unionSpec);
  fs.add("tspconfig.yaml", "kind: project\nfeatures:\n  - union-extends\n");

  const [, diagnostics] = await compileScenario(testCompiler, mainFile);

  expect(diagnostics).toEqual([]);
});

it("does not enable features without a scenario config", async () => {
  fs.add("main.tsp", unionSpec);

  const [, diagnostics] = await compileScenario(testCompiler, mainFile);

  expect(diagnostics.map((diagnostic) => diagnostic.code)).toContain("union-extends-disabled");
});

it("reports configuration errors as well as compiler diagnostics", async () => {
  fs.add("main.tsp", "model Example {}");
  fs.add("tspconfig.yaml", "kind: project\nfeatures: [\n");

  const [program, diagnostics] = await compileScenario(testCompiler, mainFile);

  expect(program.diagnostics).toEqual([]);
  expect(diagnostics.some((diagnostic) => diagnostic.severity === "error")).toBe(true);
});

it("preserves validation imports without activating configured emitters or linters", async () => {
  fs.add("main.tsp", "model Example { child: Child; }");
  fs.add("import.tsp", "model Child { name: string; }");
  fs.add(
    "tspconfig.yaml",
    `
kind: project
imports:
  - missing-library
emit:
  - missing-emitter
linter:
  extends:
    - missing-linter
`,
  );

  const [, diagnostics] = await compileScenario(testCompiler, mainFile, {
    additionalImports: [resolveVirtualPath("import.tsp")],
  });

  expect(diagnostics).toEqual([]);
});
