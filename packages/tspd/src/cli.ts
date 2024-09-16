/* eslint-disable no-console */
import { NodeHost, logDiagnostics, resolvePath, typespecVersion } from "@typespec/compiler";
import pc from "picocolors";
import yargs from "yargs";
import { generateExternSignatures } from "./gen-extern-signatures/gen-extern-signatures.js";
import { generateLibraryDocs } from "./ref-doc/experimental.js";

try {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  await import("source-map-support/register.js");
} catch {
  // package only present in dev.
}

function logExperimentalWarning(type: "log" | "error") {
  const log =
    type === "error"
      ? (message: string) => console.error(pc.red(message))
      : (message: string) => console.log(pc.yellow(message));
  log("-".repeat(100));
  log(
    `tspd (TypeSpec Library Developer Cli) is experimental and might be ${pc.bold(
      "BREAKING",
    )} between versions.`,
  );
  if (type === "error") {
    log(`Add "--enable-experimental" flag to acknowledge this and continue.`);
  }
  log("-".repeat(100));
}

async function main() {
  console.log(`TypeSpec Developer Tools v${typespecVersion}\n`);

  await yargs(process.argv.slice(2))
    .scriptName("tspd")
    .help()
    .strict()
    .parserConfiguration({
      "greedy-arrays": false,
      "boolean-negation": false,
    })
    .option("debug", {
      type: "boolean",
      description: "Output debug log messages.",
      default: false,
    })
    .option("pretty", {
      type: "boolean",
      description:
        "Enable color and formatting in TypeSpec's output to make compiler errors easier to read.",
      default: true,
    })
    .option("enable-experimental", {
      type: "boolean",
      description: "Acknowledge that the tspd command line is experiemental.",
      default: false,
    })
    .check((args) => {
      if (args["enable-experimental"]) {
        logExperimentalWarning("log");
        return true;
      } else {
        logExperimentalWarning("error");
        process.exit(1);
      }
    })
    .command(
      "doc <entrypoint>",
      "Generate documentation for a TypeSpec library.",
      (cmd) => {
        return cmd
          .positional("entrypoint", {
            description: "Path to the library entrypoint.",
            type: "string",
            demandOption: true,
          })
          .option("output-dir", {
            type: "string",
          });
      },
      async (args) => {
        const resolvedRoot = resolvePath(process.cwd(), args.entrypoint);
        const host = NodeHost;
        const diagnostics = await generateLibraryDocs(
          resolvedRoot,
          args["output-dir"] ?? resolvePath(resolvedRoot, "docs"),
        );
        // const diagnostics = await generateExternSignatures(host, resolvedRoot);
        if (diagnostics.length > 0) {
          logDiagnostics(diagnostics, host.logSink);
        }
      },
    )
    .command(
      "gen-extern-signature <entrypoint>",
      "Format given list of TypeSpec files.",
      (cmd) => {
        return cmd.positional("entrypoint", {
          description: "Path to the library entrypoint.",
          type: "string",
          demandOption: true,
        });
      },
      async (args) => {
        const resolvedRoot = resolvePath(process.cwd(), args.entrypoint);
        const host = NodeHost;
        const diagnostics = await generateExternSignatures(host, resolvedRoot);
        if (diagnostics.length > 0) {
          logDiagnostics(diagnostics, host.logSink);
        }
      },
    )
    .version(typespecVersion)
    .demandCommand(1, "You must use one of the supported commands.").argv;
}

function internalError(error: unknown): never {
  // NOTE: An expected error, like one thrown for bad input, shouldn't reach
  // here, but be handled somewhere else. If we reach here, it should be
  // considered a bug and therefore we should not suppress the stack trace as
  // that risks losing it in the case of a bug that does not repro easily.

  console.error("Internal error!");
  console.error("File issue at https://github.com/microsoft/typespec");
  console.error();
  console.error(error);

  process.exit(1);
}

process.on("unhandledRejection", (error: unknown) => {
  console.error("Unhandled promise rejection!");
  internalError(error);
});

main().catch(internalError);
