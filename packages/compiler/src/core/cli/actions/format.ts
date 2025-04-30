import pc from "picocolors";
import { logDiagnostics } from "../../diagnostics.js";
import { findUnformattedTypeSpecFiles, formatFiles } from "../../formatter-fs.js";
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
      log(`Found ${unformatted.length} unformatted files:`);
      for (const file of unformatted) {
        log(` - ${file}`);
      }
      process.exit(1);
    }
  } else {
    const result = await formatFiles(args["include"], {
      exclude: args["exclude"],
      debug: args.debug,
    });
    const results = [pc.green(`${result.formattedFiles.length} formatted`)];
    if (result.ignoredFiles.length > 0) {
      results.push(pc.gray(`${result.ignoredFiles.length} ignored`));
    }
    if (result.erroredFiles.length > 0) {
      logDiagnostics(
        result.erroredFiles.map((x) => x[1]),
        host.logSink,
      );
      results.push(
        pc.red(`${result.erroredFiles.length} error${result.erroredFiles.length > 1 ? "s" : ""}`),
      );
    }
    log(`${results.join(", ")}`);

    if (result.erroredFiles.length > 0) {
      process.exit(1);
    }
  }
}

function log(message: string) {
  // eslint-disable-next-line no-console
  console.log(message);
}
