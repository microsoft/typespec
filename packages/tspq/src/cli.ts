/* eslint-disable no-console */
import { logDiagnostics, NodeHost, resolvePath } from "@typespec/compiler";
import yargs from "yargs";
import { compileWithLocalCompiler } from "./compile-with-local-compiler.js";
import { formatSummary, formatTypeView, getTypeViewJson } from "./printer.js";
import { summarizeProgram } from "./summary.js";

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
      "view <reference>",
      "View details about a specific type.",
      (cmd) => {
        return cmd
          .positional("reference", {
            description: "Type reference to inspect.",
            type: "string",
          })
          .option("json", {
            type: "boolean",
            description: "Output view as JSON.",
            default: false,
          })
          .option("entrypoint", {
            description: "Path to the TypeSpec entrypoint.",
            type: "string",
          });
      },
      async (args) => {
        const program = await compileWithLocalCompiler(resolvePath(process.cwd(), args.entrypoint));

        if (program.diagnostics.length > 0) {
          logDiagnostics(program.diagnostics, NodeHost.logSink);
          if (program.hasError()) {
            process.exit(1);
          }
        }

        if (!args.reference) {
          console.error("Type reference is required.");
          process.exit(1);
        }

        const [resolvedType, diagnostics] = program.resolveTypeReference(args.reference);
        if (diagnostics.length > 0) {
          logDiagnostics(diagnostics, NodeHost.logSink);
          if (diagnostics.some((diag) => diag.severity === "error")) {
            process.exit(1);
          }
        }

        if (!resolvedType) {
          console.error(`Type reference not found: ${args.reference}`);
          process.exit(1);
        }

        if (args.json) {
          console.log(JSON.stringify(getTypeViewJson(program, resolvedType), null, 2));
        } else {
          console.log(formatTypeView(program, resolvedType, args.pretty));
        }
      },
    )
    .command(
      "summary",
      "Compile a TypeSpec spec and print a summary.",
      (cmd) => {
        return cmd
          .option("entrypoint", {
            description: "Path to the TypeSpec entrypoint.",
            type: "string",
          })
          .option("json", {
            type: "boolean",
            description: "Output summary as JSON.",
            default: false,
          });
      },
      async (args) => {
        const program = await compileWithLocalCompiler(resolvePath(process.cwd(), args.entrypoint));

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
