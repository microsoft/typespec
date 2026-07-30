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

describe("exclude-interfaces option", () => {
  it("generates all controllers and interfaces when no exclusions are specified", async () => {
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

    assertFileEmitted(fs, "OperationsController.cs");
    assertFileEmitted(fs, "IOperations.cs");
    assertFileEmitted(fs, "WidgetsController.cs");
    assertFileEmitted(fs, "IWidgets.cs");
  });

  it("skips controller and interface files for excluded interfaces", async () => {
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
      { "skip-format": true, "exclude-interfaces": ["Operations"] },
    );

    assertFileNotEmitted(fs, "OperationsController.cs");
    assertFileNotEmitted(fs, "IOperations.cs");
    assertFileEmitted(fs, "WidgetsController.cs");
    assertFileEmitted(fs, "IWidgets.cs");
  });

  it("excludes multiple interfaces when multiple names are provided", async () => {
    const fs = await compile(
      tester,
      `
      interface Operations {
        @route("/operations") @get list(): string[];
      }
      interface Widgets {
        @route("/widgets") @get list(): string[];
      }
      interface Gadgets {
        @route("/gadgets") @get list(): string[];
      }
    `,
      { "skip-format": true, "exclude-interfaces": ["Operations", "Widgets"] },
    );

    assertFileNotEmitted(fs, "OperationsController.cs");
    assertFileNotEmitted(fs, "IOperations.cs");
    assertFileNotEmitted(fs, "WidgetsController.cs");
    assertFileNotEmitted(fs, "IWidgets.cs");
    assertFileEmitted(fs, "GadgetsController.cs");
    assertFileEmitted(fs, "IGadgets.cs");
  });

  it("has no effect when the excluded interface name does not exist", async () => {
    const fs = await compile(
      tester,
      `
      interface Widgets {
        @route("/widgets") @get list(): string[];
      }
    `,
      { "skip-format": true, "exclude-interfaces": ["Operations"] },
    );

    assertFileEmitted(fs, "WidgetsController.cs");
    assertFileEmitted(fs, "IWidgets.cs");
  });
});
