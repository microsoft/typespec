import { InitTemplateError, initTypeSpecProject } from "../../../init/init.js";
import { logDiagnostics } from "../../diagnostics.js";
import { createCLICompilerHost } from "../utils.js";

export interface InitArgs {
  templatesUrl?: string;
  pretty?: boolean;
}

export async function initAction(args: InitArgs) {
  const host = createCLICompilerHost(args);
  try {
    await initTypeSpecProject(host, process.cwd(), args.templatesUrl);
  } catch (e) {
    if (e instanceof InitTemplateError) {
      logDiagnostics(e.diagnostics, host.logSink);
      process.exit(1);
    }
    throw e;
  }
}
