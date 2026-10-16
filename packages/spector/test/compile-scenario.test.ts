import * as compiler from "@typespec/compiler";
import { mkdtempSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { afterEach, beforeEach, expect, it } from "vitest";
import { compileScenario } from "../src/spec-utils/compile-scenario.js";

let directory: string;

beforeEach(() => {
  directory = mkdtempSync(join(tmpdir(), "spector-config-"));
});

afterEach(() => {
  rmSync(directory, { recursive: true, force: true });
});

const unionSpec = `
  model Base { name: string; }
  model Child extends Base {}
  union Example extends Base { child: Child }
`;

it("honors scenario project feature flags", async () => {
  writeFileSync(join(directory, "main.tsp"), unionSpec);
  writeFileSync(join(directory, "tspconfig.yaml"), "kind: project\nfeatures:\n  - union-extends\n");

  const [, diagnostics] = await compileScenario(compiler, join(directory, "main.tsp"));

  expect(diagnostics).toEqual([]);
});

it("does not enable features without a scenario config", async () => {
  writeFileSync(join(directory, "main.tsp"), unionSpec);

  const [, diagnostics] = await compileScenario(compiler, join(directory, "main.tsp"));

  expect(diagnostics.map((diagnostic) => diagnostic.code)).toContain("union-extends-disabled");
});

it("reports configuration errors as well as compiler diagnostics", async () => {
  writeFileSync(join(directory, "main.tsp"), "model Example {}");
  writeFileSync(join(directory, "tspconfig.yaml"), "kind: project\nfeatures: [\n");

  const [program, diagnostics] = await compileScenario(compiler, join(directory, "main.tsp"));

  expect(program.diagnostics).toEqual([]);
  expect(diagnostics.some((diagnostic) => diagnostic.severity === "error")).toBe(true);
});

it("preserves validation imports without activating configured emitters or linters", async () => {
  writeFileSync(join(directory, "main.tsp"), "model Example { child: Child; }");
  writeFileSync(join(directory, "import.tsp"), "model Child { name: string; }");
  writeFileSync(
    join(directory, "tspconfig.yaml"),
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

  const [, diagnostics] = await compileScenario(compiler, join(directory, "main.tsp"), {
    additionalImports: [join(directory, "import.tsp")],
  });

  expect(diagnostics).toEqual([]);
});
