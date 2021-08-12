import { strictEqual } from "assert";
import { mkdir, readFile, writeFile } from "fs/promises";
import { dirname, join, resolve } from "path";
import prettier from "prettier";
import { fileURLToPath } from "url";
import * as plugin from "../../../formatter/index.js";

function format(code: string): string {
  const output = prettier.format(code, {
    parser: "cadl",
    plugins: [plugin],
  });
  return output;
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const scenarioRoot = resolve(__dirname, "../../../../test/formatter/scenarios");
const shouldUpdate = process.argv.indexOf("--update-snapshots") !== -1;

async function getOutput(name: string): Promise<string | undefined> {
  try {
    const output = await readFile(join(scenarioRoot, "outputs", name));
    return output.toString();
  } catch {
    return undefined;
  }
}

async function saveOutput(name: string, content: string) {
  const outputDir = join(scenarioRoot, "outputs");
  await mkdir(outputDir, { recursive: true });
  await writeFile(join(outputDir, name), content);
}

async function testScenario(name: string) {
  const content = await readFile(join(scenarioRoot, "inputs", name));
  const output = await getOutput(name);
  const formatted = format(content.toString());
  if (!output) {
    return await saveOutput(name, formatted);
  }
  if (output !== formatted) {
    if (shouldUpdate) {
      return await saveOutput(name, formatted);
    }

    strictEqual(
      formatted,
      output,
      `Scenario ${name} does not match expected snapshot. Run with tests '--update-snapshots' option to update.`
    );
  }
}

describe("cadl: prettier formatter scenarios", () => {
  it("misc", async () => {
    await testScenario("misc.cadl");
  });

  it("alias", async () => {
    await testScenario("alias.cadl");
  });

  it("model", async () => {
    await testScenario("model.cadl");
  });
});
