import { beforeEach, describe, it } from "vitest";
import { navigateProgram } from "../src/core/semantic-walker.js";
import {
  TestHost,
  createTestHost,
  expectDiagnosticEmpty,
  expectDiagnostics,
} from "../src/testing/index.js";

describe("compiler: suppress", () => {
  let host: TestHost;

  beforeEach(async () => {
    host = await createTestHost();
  });

  async function run(typespec: string) {
    host.addTypeSpecFile("main.tsp", typespec);

    await host.compile("main.tsp", { nostdlib: true });

    navigateProgram(host.program, {
      model: (model) => {
        if (model.name === "") {
          host.program.reportDiagnostic({
            severity: "warning",
            code: "no-inline-model",
            message: "Inline models are not recommended",
            target: model,
          });
        }
      },
      modelProperty: (prop) => {
        if (prop.name === "id") {
          host.program.reportDiagnostic({
            severity: "error",
            code: "no-id-property",
            message: "Id properties on models are forbidden",
            target: prop,
          });
        }
      },
    });

    return host.program.diagnostics;
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
