import pc from "picocolors";
import prompts from "prompts";
import { InitTemplateError, initTypeSpecProject } from "../../../init/init.js";
import { installTypeSpecDependencies } from "../../install.js";
import { Diagnostic } from "../../types.js";
import { CliCompilerHost } from "../types.js";

export interface InitArgs {
  templatesUrl?: string;
  template?: string;
  install?: boolean;
}

export async function initAction(
  host: CliCompilerHost,
  args: InitArgs,
): Promise<readonly Diagnostic[]> {
  try {
    await initTypeSpecProject(host, process.cwd(), args);
    if (args.install) {
      const { confirm } = await prompts([
        {
          type: "confirm",
          name: "confirm",
          message: `Install dependencies?`,
          initial: true,
        },
      ]);
    
      if (confirm) {
        // eslint-disable-next-line no-console
        console.log(pc.green(`Installing dependencies...`));
        await installTypeSpecDependencies(host, process.cwd());      
      }  
    }
    return [];
  } catch (e) {
    if (e instanceof InitTemplateError) {
      return e.diagnostics;
    }
    throw e;
  }
}
