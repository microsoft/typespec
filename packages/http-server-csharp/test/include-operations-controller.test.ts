import { TestFileSystem, TesterInstance } from "@typespec/compiler/testing";
import assert from "assert";
import { beforeEach, describe, it } from "vitest";
import { CSharpServiceEmitterOptions } from "../src/lib.js";
import { ApiTester, compileAndDiagnose, getStandardService } from "./test-host.js";

function assertFileEmitted(fs: TestFileSystem, fileName: string): void {
  const result = [...fs.fs.entries()].filter((e) => e[0].includes(`/${fileName}`));
  assert.strictEqual(
    result.length,
    1,
    `Expected ${fileName} to be emitted, but it was not found (${result.length} matches)`,
  );
}

function assertFileNotEmitted(fs: TestFileSystem, fileName: string): void {
  const result = [...fs.fs.entries()].filter((e) => e[0].includes(`/${fileName}`));
  assert.strictEqual(result.length, 0, `Expected ${fileName} to not be emitted, but it was`);
}

async function compile(
  tester: TesterInstance,
  code: string,
  emitterOptions: CSharpServiceEmitterOptions = { "skip-format": true },
): Promise<TestFileSystem> {
  const [result] = await compileAndDiagnose(tester, getStandardService(code), emitterOptions);
  return result.fs;
}

let tester: TesterInstance;

beforeEach(async () => {
  tester = await ApiTester.createInstance();
});

describe("include-operations-controller option", () => {
  it("excludes the Operations controller and interface by default", async () => {
    const fs = await compile(
      tester,
      `
      interface Operations {
        @route("/operations") @get list(): string[];
      }
      interface Widgets {
        @route("/widgets") @get list(): string[];
      }
    `,
    );

    assertFileNotEmitted(fs, "OperationsController.cs");
    assertFileNotEmitted(fs, "IOperations.cs");
    assertFileEmitted(fs, "WidgetsController.cs");
    assertFileEmitted(fs, "IWidgets.cs");
  });

  it("includes the Operations controller and interface when option is true", async () => {
    const fs = await compile(
      tester,
      `
      interface Operations {
        @route("/operations") @get list(): string[];
      }
      interface Widgets {
        @route("/widgets") @get list(): string[];
      }
    `,
      { "skip-format": true, "include-operations-controller": true },
    );

    assertFileEmitted(fs, "OperationsController.cs");
    assertFileEmitted(fs, "IOperations.cs");
    assertFileEmitted(fs, "WidgetsController.cs");
    assertFileEmitted(fs, "IWidgets.cs");
  });

  it("does not exclude synthetic namespace-level Operations interfaces (only exact 'Operations' name is excluded)", async () => {
    // Namespace-level operations produce a synthetic `${ns.name}Operations` interface
    // (e.g. ContosoOperations). These are kept; only an interface literally named "Operations" is excluded.
    const [result] = await compileAndDiagnose(
      tester,
      `
      @service(#{title: "Contoso"})
      namespace Contoso {
        @route("/operations") @get op listOps(): string[];
        interface Widgets {
          @route("/widgets") @get list(): string[];
        }
      }
    `,
      { "skip-format": true },
    );
    const fs = result.fs;

    // Synthetic ContosoOperations interface is NOT named "Operations" so it is still emitted
    assertFileEmitted(fs, "ContosoOperationsController.cs");
    assertFileEmitted(fs, "IContosoOperations.cs");
    assertFileEmitted(fs, "WidgetsController.cs");
    assertFileEmitted(fs, "IWidgets.cs");
  });

  it("does not affect non-Operations interfaces when option is false (default)", async () => {
    const fs = await compile(
      tester,
      `
      interface Widgets {
        @route("/widgets") @get list(): string[];
      }
    `,
    );

    assertFileEmitted(fs, "WidgetsController.cs");
    assertFileEmitted(fs, "IWidgets.cs");
  });
});
