import { download } from "@vscode/test-electron";
import type { TestProject } from "vitest/node";

// VS Code 1.130.0 introduced a regression that causes the E2E tests to hang.
// Pin to 1.129.1 until the regression is resolved in a later release.
const VSCODE_PINNED_VERSION = "1.129.1";

/**
 * The global method will download a brand new vscode to your local computer.
 * Subsequent cases will be executed in this vscode.
 */
export default async function downloadVscode({ provide }: TestProject) {
  if (process.env.VSCODE_E2E_DOWNLOAD_PATH) {
    provide("executablePath", process.env.VSCODE_E2E_DOWNLOAD_PATH);
  } else {
    provide("executablePath", await download({ version: VSCODE_PINNED_VERSION }));
  }
}

declare module "vitest" {
  export interface ProvidedContext {
    executablePath: string;
  }
}
