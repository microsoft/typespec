import yargs from "yargs";
import { compileAction } from "./actions/compile/compile.js";
import { withCliHost } from "./utils.js";

async function main() {
  await yargs(process.argv.slice(2))
    //.scriptName("o2t")
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
            describe: "The output path for generated artifacts.",
          });
      },
      withCliHost((host, args) => compileAction(host, args))
    )
    .version("1")
    .demandCommand(1, "You must use one of the supported commands.").argv;
}

main().catch((error: unknown) => {
  // eslint-disable-next-line no-console
  console.error(error);

  process.exit(1);
});
