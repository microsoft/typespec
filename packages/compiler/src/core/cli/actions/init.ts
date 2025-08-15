import { InitTemplateError, initTypeSpecProject } from "../../../init/init.js";
import { resolvePath } from "../../path-utils.js";
import { Diagnostic } from "../../types.js";
import { CliCompilerHost } from "../types.js";

export interface InitArgs {
  templatesUrl?: string;
  template?: string;
  "no-prompt"?: boolean;
  args?: string[];
  "project-name"?: string;
  emitters?: string[];
  outputDir?: string;
}

export async function initAction(
  host: CliCompilerHost,
  args: InitArgs,
): Promise<readonly Diagnostic[]> {
  try {
    const outputDir = args.outputDir?.trim();
    const directory = outputDir ? resolvePath(process.cwd(), outputDir) : process.cwd();
    await initTypeSpecProject(host, directory, args);
    return [];
  } catch (e) {
    if (e instanceof InitTemplateError) {
      return e.diagnostics;
    }
    throw e;
  }
}
