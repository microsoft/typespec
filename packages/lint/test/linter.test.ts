import { createCadlLibrary, Diagnostic } from "@cadl-lang/compiler";
import {
  createTestHost,
  expectDiagnosticEmpty,
  expectDiagnostics,
} from "@cadl-lang/compiler/testing";
import { createRule, getLinter, LibraryLinter } from "../src/index.js";

describe("lint: linter", () => {
  let linter: LibraryLinter;

  beforeEach(() => {
    linter = getLinter(createCadlLibrary({ name: "test-lib", diagnostics: {} }));
    const linterSingletonKey = Symbol.for("@cadl-lang/lint.singleton");
    (globalThis as any)[linterSingletonKey] = undefined;
  });

  async function runLinter(code: string): Promise<readonly Diagnostic[]> {
    const host = await createTestHost();
    host.addCadlFile(
      "main.cadl",
      `
      ${code};
    `
    );

    await host.compile("main.cadl");
    linter.lintProgram(host.program);
    return host.program.diagnostics;
  }

  const noModelFoo = createRule({
    name: "no-model-foo",
    create(context) {
      return {
        model: (target) => {
          if (target.name === "Foo") {
            context.program.reportDiagnostic({
              code: "no-model-foo",
              message: "Cannot call model 'Foo'",
              target,
              severity: "warning",
            });
          }
        },
      };
    },
  });

  it("registering a rule doesn't enable it", async () => {
    linter.registerRule(noModelFoo);

    const diagnostics = await runLinter(`
      model Foo {}
    `);
    expectDiagnosticEmpty(diagnostics);
  });

  it("registering with enabling a rule shouldn't emit diagnostic unless autoEnableMyRules is called", async () => {
    linter.registerRule(noModelFoo, { autoEnable: true });

    const diagnostics = await runLinter(`
      model Foo {}
    `);
    expectDiagnosticEmpty(diagnostics);
  });

  it("registering with enabling a rule should emit diagnostics iof autoEnableMyRules is called", async () => {
    linter.registerRule(noModelFoo, { autoEnable: true });
    linter.autoEnableRules();

    const diagnostics = await runLinter(`
      model Foo {}
    `);
    expectDiagnostics(diagnostics, { code: "no-model-foo" });
  });

  it("registering then enabling a rule should emit diagnostics", async () => {
    linter.registerRule(noModelFoo);
    linter.enableRule("test-lib/" + noModelFoo.name);

    const diagnostics = await runLinter(`
      model Foo {}
    `);
    expectDiagnostics(diagnostics, { code: "no-model-foo" });
  });
});
