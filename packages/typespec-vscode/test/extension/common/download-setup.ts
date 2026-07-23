import { download } from "@vscode/test-electron";
import type { TestProject } from "vitest/node";

// Pin to VS Code Stable 1.129.1 (last known good). `download()` otherwise resolves
// the *latest* stable build, so a broken release breaks/hangs CI globally: VS Code
// 1.130.0 caused the extension test host to hang until the per-test timeout.
// Bump this once a newer version has been validated.
const VSCODE_VERSION = "1.129.1";

/**
 * The global method will download a brand new vscode to your local computer.
 * Subsequent cases will be executed in this vscode.
 */
export default async function downloadVscode({ provide }: TestProject) {
  if (process.env.VSCODE_E2E_DOWNLOAD_PATH) {
    provide("executablePath", process.env.VSCODE_E2E_DOWNLOAD_PATH);
  } else {
    provide("executablePath", await download({ version: VSCODE_VERSION }));
  }
}

declare module "vitest" {
  export interface ProvidedContext {
    executablePath: string;
  }
}
