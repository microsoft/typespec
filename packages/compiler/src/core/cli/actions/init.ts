import { InitTemplateError, initTypeSpecProject } from "../../../init/init.js";
import { installTypeSpecDependencies } from "../../install.js";
import { Diagnostic } from "../../types.js";
import { CliCompilerHost } from "../types.js";

export interface InitArgs {
  templatesUrl?: string;
  template?: string;
  skipInstall?: boolean;
}

export async function initAction(
  host: CliCompilerHost,
  args: InitArgs,
): Promise<readonly Diagnostic[]> {
  try {
    await initTypeSpecProject(host, process.cwd(), args);
    if (!args.skipInstall) {
      await installTypeSpecDependencies(host, process.cwd());
    }
    return [];
  } catch (e) {
    if (e instanceof InitTemplateError) {
      return e.diagnostics;
    }
    throw e;
  }
}
