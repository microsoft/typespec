/* eslint-disable no-console */
import { resolvePath, typespecVersion } from "@typespec/compiler";
import yargs from "yargs";
import { bundleTypeSpecLibrary } from "./bundler.js";

try {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  await import("source-map-support/register.js");
} catch {
  // package only present in dev.
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
    .command(
      "bundle <entrypoint>",
      "Generate browser compatible bundle.",
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
        await bundleTypeSpecLibrary(
          resolvedRoot,
          args["output-dir"] ?? resolvePath(resolvedRoot, "out/browser"),
        );
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
