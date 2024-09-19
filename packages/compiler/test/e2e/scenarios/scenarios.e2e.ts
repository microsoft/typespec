import { rejects } from "assert";
import { resolve } from "path";
import { describe, it } from "vitest";
import { NodeHost, Program, compile, resolvePath } from "../../../src/core/index.js";
import { CompilerOptions } from "../../../src/core/options.js";
import { expectDiagnosticEmpty, expectDiagnostics } from "../../../src/testing/expect.js";
import { findTestPackageRoot } from "../../../src/testing/test-utils.js";

const scenarioRoot = resolvePath(await findTestPackageRoot(import.meta.url), "test/e2e/scenarios");

describe("compiler: entrypoints", () => {
  async function compileScenario(name: string, options: CompilerOptions = {}): Promise<Program> {
    return compile(NodeHost, resolve(scenarioRoot, name), { ...options });
  }

  describe("compile library", () => {
    it("compile library with JS entrypoint", async () => {
      const program = await compileScenario("js-lib");
      expectDiagnosticEmpty(program.diagnostics);
    });

    it("compile library with TypeSpec entrypoint", async () => {
      const program = await compileScenario("typespec-lib");
      expectDiagnosticEmpty(program.diagnostics);
    });

    it("emit diagnostics if library has invalid main", async () => {
      const program = await compileScenario("invalid-lib");
      expectDiagnostics(program.diagnostics, {
        code: "invalid-main",
        message: "Main file must either be a .tsp file or a .js file.",
      });
    });

    it("compile library with TypeSpec entrypoint and emitter", async () => {
      const program = await compileScenario("emitter-with-typespec", {
        emit: ["@typespec/test-emitter-with-typespec"],
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
        message: `Library "my-lib" has an invalid tspMain file.`,
      });
    });

    it("emit diagnostics if emitter has invalid main", async () => {
      const program = await compileScenario("import-library-invalid", {
        emit: ["my-lib"],
      });
      expectDiagnostics(program.diagnostics, {
        code: "library-invalid",
        message: `Library "my-lib" has an invalid main file.`,
      });
    });

    it("emit diagnostics if emitter require import that is not imported", async () => {
      const program = await compileScenario("emitter-require-import", {
        emit: ["@typespec/my-emitter"],
      });
      expectDiagnostics(program.diagnostics, {
        code: "missing-import",
        message: `Emitter '@typespec/my-emitter' requires '@typespec/my-lib' to be imported. Add 'import "@typespec/my-lib".`,
      });
    });

    it("report error if emitter fail unexpectedly", async () => {
      await rejects(
        () =>
          compileScenario("emitter-throw-error", {
            emit: ["@typespec/my-emitter"],
          }),
        new RegExp(
          [
            `Emitter "@typespec/my-emitter" crashed! This is a bug.`,
            `Please file an issue at https://github.com/microsoft/my-emitter/issues`,
            ``,
            `Error: This is bad`,
          ].join("\n"),
        ),
      );
    });

    it("report error if onValidate fail unexpectedly", async () => {
      await rejects(
        () => compileScenario("validator-throw-error"),
        new RegExp(
          [
            `Library "@typespec/my-validator" \\$onValidate crashed! This is a bug.`,
            `Please file an issue at https://github.com/microsoft/my-validator/issues`,
            ``,
            `Error: This is bad`,
          ].join("\n"),
        ),
      );
    });

    it("succeed if required import from an emitter is imported", async () => {
      const program = await compileScenario("emitter-require-import", {
        emit: ["@typespec/my-emitter"],
        additionalImports: ["@typespec/my-lib"],
      });
      expectDiagnosticEmpty(program.diagnostics);
    });

    it("succeed if loading different install of the same library at the same version", async () => {
      const program = await compileScenario("same-library-same-version", {
        emit: ["@typespec/lib2"],
      });
      expectDiagnosticEmpty(program.diagnostics);
    });

    it("emit error if loading different install of the same library at different version", async () => {
      const program = await compileScenario("same-library-diff-version", {
        emit: ["@typespec/lib2"],
      });
      expectDiagnostics(program.diagnostics, {
        code: "incompatible-library",
        message: [
          `Multiple versions of "@typespec/my-lib" library were loaded:`,
          `  - Version: "1.0.0" installed at "${scenarioRoot}/same-library-diff-version/node_modules/@typespec/lib1"`,
          `  - Version: "2.0.0" installed at "${scenarioRoot}/same-library-diff-version/node_modules/@typespec/lib2"`,
        ].join("\n"),
      });
    });

    it("Back compat: succeed if main.cadl exists", async () => {
      const program = await compileScenario("backcompat-cadl-file-only", {
        emit: [],
        additionalImports: [],
      });
      expectDiagnosticEmpty(program.diagnostics);
    });

    it("Back compat: succeed if package.json has cadlMain", async () => {
      const program = await compileScenario("backcompat-package-cadlMain", {
        emit: [],
        additionalImports: [],
      });
      expectDiagnosticEmpty(program.diagnostics);
    });

    it("Back compat: succeed if main.cadl exists and package.json with no tsp/cadlMain", async () => {
      const program = await compileScenario("backcompat-package-no_main", {
        emit: [],
        additionalImports: [],
      });
      expectDiagnosticEmpty(program.diagnostics);
    });

    it("Back compat: succeed if package.json tspMain points to custom lib.cadl", async () => {
      const program = await compileScenario("backcompat-package-tspMain-customCadl", {
        emit: [],
        additionalImports: [],
      });
      expectDiagnosticEmpty(program.diagnostics);
    });

    it("Back compat: succeed if package.json tspMain points to main.cadl", async () => {
      const program = await compileScenario("backcompat-package-tspMain-mainCadl", {
        emit: [],
        additionalImports: [],
      });
      expectDiagnosticEmpty(program.diagnostics);
    });
  });
});
