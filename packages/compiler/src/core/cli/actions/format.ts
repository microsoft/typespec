import { logDiagnostics } from "../../diagnostics.js";
import { findUnformattedTypeSpecFiles, formatTypeSpecFiles } from "../../formatter-fs.js";
import { CliCompilerHost } from "../types.js";

export interface FormatArgs {
  include: string[];
  exclude?: string[];
  debug?: boolean;
  check?: boolean;
}
export async function formatAction(host: CliCompilerHost, args: FormatArgs) {
  if (args["check"]) {
    const unformatted = await findUnformattedTypeSpecFiles(args["include"], {
      exclude: args["exclude"],
      debug: args.debug,
    });
    if (unformatted.length > 0) {
      // eslint-disable-next-line no-console
      console.log(`Found ${unformatted.length} unformatted files:`);
      for (const file of unformatted) {
        // eslint-disable-next-line no-console
        console.log(` - ${file}`);
      }
      process.exit(1);
    }
  } else {
    const [_, diagnostics] = await formatTypeSpecFiles(args["include"], {
      exclude: args["exclude"],
      debug: args.debug,
    });
    if (diagnostics.length > 0) {
      logDiagnostics(diagnostics, host.logSink);
      process.exit(1);
    }
  }
}
