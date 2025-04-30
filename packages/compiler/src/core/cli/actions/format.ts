import pc from "picocolors";
import { logDiagnostics } from "../../diagnostics.js";
import { checkFilesFormat, formatFiles } from "../../formatter-fs.js";
import { Diagnostic } from "../../types.js";
import { CliCompilerHost } from "../types.js";

export interface FormatArgs {
  include: string[];
  exclude?: string[];
  debug?: boolean;
  check?: boolean;
}

export async function formatAction(host: CliCompilerHost, args: FormatArgs) {
  if (args["check"]) {
    await check(host, args);
  } else {
    await format(host, args);
  }
}

async function check(host: CliCompilerHost, args: FormatArgs) {
  await host.logger.trackAction("Checking format", "", async (task) => {
    const result = await checkFilesFormat(args["include"], {
      exclude: args["exclude"],
    });
    if (result.errored.length > 0) {
      logDiagnostics(
        result.errored.map((x) => x[1]),
        host.logSink,
      );
    }

    if (result.needsFormat.length > 0 || result.errored.length > 0) {
      const msg = [
        needsFormatCount(result.needsFormat),
        result.errored.length > 0 ? errorCount(result.errored) : undefined,
        formattedCount(result.formatted),
        result.ignored.length > 0 ? ignoredCount(result.ignored) : undefined,
      ];

      task.warn(msg.filter((x) => x).join(", "));
      process.exit(1);
    } else {
      const msg = [
        formattedCount(result.formatted),
        result.ignored.length > 0 ? ignoredCount(result.ignored) : undefined,
      ];
      task.succeed(msg.filter((x) => x).join(", "));
    }
  });
}

async function format(host: CliCompilerHost, args: FormatArgs) {
  await host.logger.trackAction("Formatting", "", async (task) => {
    const result = await formatFiles(args["include"], {
      exclude: args["exclude"],
    });
    const msg = [
      result.formatted.length > 0 ? formattedCount(result.formatted) : undefined,
      result.alreadyFormatted.length > 0
        ? alreadyFormattedCount(result.alreadyFormatted)
        : undefined,
      result.ignored.length > 0 ? ignoredCount(result.ignored) : undefined,
      result.errored.length > 0 ? errorCount(result.errored) : undefined,
    ]
      .filter((x) => x)
      .join(", ");

    if (result.errored.length > 0) {
      logDiagnostics(
        result.errored.map((x) => x[1]),
        host.logSink,
      );
      task.warn(msg);
      process.exit(1);
    } else {
      task.succeed(msg);
    }
  });
}

function formattedCount(files: readonly string[]): string {
  return pc.green(`${files.length} formatted`);
}
function alreadyFormattedCount(files: readonly string[]): string {
  return pc.green(`${files.length} already formatted`);
}
function needsFormatCount(files: readonly string[]): string {
  return pc.yellow(`${files.length} need format`);
}
function ignoredCount(files: readonly string[]): string {
  return pc.gray(`${files.length} ignored`);
}
function errorCount(errored: readonly [string, Diagnostic][]): string {
  return pc.red(`${errored.length} error${errored.length > 1 ? "s" : ""}`);
}
