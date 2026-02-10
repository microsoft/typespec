/* eslint-disable no-console */
import { compile, logDiagnostics, NodeHost, resolvePath } from "@typespec/compiler";
import yargs from "yargs";
import { formatSummary, summarizeProgram } from "./index.js";

try {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  await import("source-map-support/register.js");
} catch {
  // package only present in dev.
}

async function main() {
  await yargs(process.argv.slice(2))
    .scriptName("tspq")
    .help()
    .strict()
    .parserConfiguration({
      "greedy-arrays": false,
      "boolean-negation": false,
    })
    .option("pretty", {
      type: "boolean",
      description: "Enable color and formatting in output.",
      default: true,
    })
    .command(
      "summary <entrypoint>",
      "Compile a TypeSpec spec and print a summary.",
      (cmd) => {
        return cmd
          .positional("entrypoint", {
            description: "Path to the TypeSpec entrypoint.",
            type: "string",
            demandOption: true,
          })
          .option("json", {
            type: "boolean",
            description: "Output summary as JSON.",
            default: false,
          });
      },
      async (args) => {
        const resolved = resolvePath(process.cwd(), args.entrypoint);
        const program = await compile(NodeHost, resolved, { noEmit: true });

        if (program.diagnostics.length > 0) {
          logDiagnostics(program.diagnostics, NodeHost.logSink);
          if (program.hasError()) {
            process.exit(1);
          }
        }

        const summary = summarizeProgram(program);
        if (args.json) {
          console.log(JSON.stringify(summary, null, 2));
        } else {
          console.log(formatSummary(summary, args.pretty));
        }
      },
    )
    .demandCommand(1, "You must use one of the supported commands.").argv;
}

function internalError(error: unknown): never {
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
