import { InitTemplateError, initTypeSpecProject } from "../../../init/init.js";
import { logDiagnostics } from "../../diagnostics.js";
import { CliCompilerHost } from "../types.js";

export interface InitArgs {
  templatesUrl?: string;
}

export async function initAction(host: CliCompilerHost, args: InitArgs) {
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
