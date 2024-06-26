import yargs from "yargs";
import { packageVersion } from "../version.js";
import { compileAction } from "./actions/compile/compile.js";
import { withCliHost } from "./utils.js";

export async function main() {
  await yargs(process.argv.slice(2))
    .help()
    .strict()
    .parserConfiguration({ "boolean-negation": false, "greedy-arrays": true })
    .command(
      "compile <path>",
      "Compile OpenAPI3 source to TypeSpec.",
      (cmd) => {
        return cmd
          .positional("path", {
            description: "The path to the OpenAPI3 file in JSON or YAML format.",
            type: "string",
            demandOption: true,
          })
          .option("output-dir", {
            type: "string",
            description:
              "The output directory for generated TypeSpec files. Will be created if it does not exist.",
            demandOption: true,
          });
      },
      withCliHost((host, args) => compileAction(host, args))
    )
    .version(packageVersion)
    .demandCommand(1, "You must use one of the supported commands.").argv;
}
