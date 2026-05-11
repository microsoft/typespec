import { describe, it } from "vitest";
import { navigateProgram } from "../src/core/semantic-walker.js";
import { expectDiagnosticEmpty, expectDiagnostics } from "../src/testing/index.js";
import { Tester } from "./tester.js";

describe("compiler: suppress", () => {
  async function run(typespec: string) {
    const { program } = await Tester.compile(typespec, {
      compilerOptions: { nostdlib: true },
    });

    navigateProgram(program, {
      model: (model) => {
        if (model.name === "") {
          program.reportDiagnostic({
            severity: "warning",
            code: "no-inline-model",
            message: "Inline models are not recommended",
            target: model,
          });
        }
      },
      modelProperty: (prop) => {
        if (prop.name === "id") {
          program.reportDiagnostic({
            severity: "error",
            code: "no-id-property",
            message: "Id properties on models are forbidden",
            target: prop,
          });
        }
      },
    });

    return program.diagnostics;
  }

  it("emit warning diagnostics when there is no suppression", async () => {
    const diagnostics = await run(`
      model Foo {
        inline: {
          name: 123;
        };
      }
    `);

    expectDiagnostics(diagnostics, { code: "no-inline-model" });
  });

  it("suppress warning diagnostic on item itself", async () => {
    const diagnostics = await run(`
      model Foo {
        #suppress "no-inline-model" "This is needed"
        inline: {
          name: 123;
        };
      }
    `);

    expectDiagnosticEmpty(diagnostics);
  });

  it("suppress warning diagnostic on parent node", async () => {
    const diagnostics = await run(`
      #suppress "no-inline-model"  "This is needed"
      model Foo {
        inline: {
          name: 123;
        };
      }
    `);
    expectDiagnosticEmpty(diagnostics);
  });

  it("error diagnostics cannot be suppressed and emit another error", async () => {
    const diagnostics = await run(`
      model Foo {
        #suppress "no-id-property" "This is needed"
        id: 123;
      }
    `);

    expectDiagnostics(diagnostics, [{ code: "suppress-error" }, { code: "no-id-property" }]);
  });
});
