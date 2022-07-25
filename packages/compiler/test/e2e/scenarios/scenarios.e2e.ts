import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { createProgram, NodeHost, Program } from "../../../core/index.js";
import { CompilerOptions } from "../../../core/options.js";
import { expectDiagnosticEmpty, expectDiagnostics } from "../../../testing/expect.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const scenarioRoot = resolve(__dirname, "../../../../test/e2e/scenarios");

describe("compiler: entrypoints", () => {
  async function compileScenario(name: string, options: CompilerOptions = {}): Promise<Program> {
    return createProgram(NodeHost, resolve(scenarioRoot, name), { ...options });
  }

  describe("compile library", () => {
    it("compile library with JS entrypoint", async () => {
      const program = await compileScenario("js-lib");
      expectDiagnosticEmpty(program.diagnostics);
    });

    it("compile library with Cadl entrypoint", async () => {
      const program = await compileScenario("cadl-lib");
      expectDiagnosticEmpty(program.diagnostics);
    });

    it("emit diagnostics if library has invalid main", async () => {
      const program = await compileScenario("invalid-lib");
      expectDiagnostics(program.diagnostics, {
        code: "invalid-main",
        message: "Main file must either be a .cadl file or a .js file.",
      });
    });

    it("compile library with Cadl entrypoint and emitter", async () => {
      const program = await compileScenario("emitter-with-cadl", {
        emitters: { "@cadl-lang/test-emitter-with-cadl": {} },
      });
      expectDiagnosticEmpty(program.diagnostics);
    });
  });

  describe("compile project", () => {
    it("emit diagnostics if imported library has invalid main", async () => {
      const program = await compileScenario("import-library-invalid", {
        additionalImports: ["my-lib"],
      });
      expectDiagnostics(program.diagnostics, {
        code: "library-invalid",
        message: `Library "my-lib" has an invalid cadlMain file.`,
      });
    });

    it("emit diagnostics if emitter has invalid main", async () => {
      const program = await compileScenario("import-library-invalid", {
        emitters: { "my-lib": {} },
      });
      expectDiagnostics(program.diagnostics, {
        code: "library-invalid",
        message: `Library "my-lib" has an invalid main file.`,
      });
    });

    it("emit diagnostics if emitter require import that is not imported", async () => {
      const program = await compileScenario("emitter-require-import", {
        emitters: { "@cadl-lang/my-emitter": {} },
      });
      expectDiagnostics(program.diagnostics, {
        code: "missing-import",
        message: `Emitter '@cadl-lang/my-emitter' requires '@cadl-lang/my-lib' to be imported. Add 'import "@cadl-lang/my-lib".`,
      });
    });

    it("succeed if required import from an emitter is imported", async () => {
      const program = await compileScenario("emitter-require-import", {
        emitters: { "@cadl-lang/my-emitter": {} },
        additionalImports: ["@cadl-lang/my-lib"],
      });
      expectDiagnosticEmpty(program.diagnostics);
    });
  });
});
