import { run } from "@typespec/internal-build-utils";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "path";

// Root of `http-server-js` package so vscode test integration runs from the correct directory
const CWD = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

export async function runScenario(
  scenario: string,
  baseUrl: string,
): Promise<{ status: "pass" | "fail" }> {
  try {
    await run(
      "npx",
      [
        "tsp-spector",
        "knock",
        "./node_modules/@typespec/http-specs/specs",
        "--filter",
        scenario,
        "--baseUrl",
        baseUrl,
      ],
      {
        cwd: CWD,
      },
    );
    return { status: "pass" };
  } catch (e) {
    return { status: "fail" };
  }
}
