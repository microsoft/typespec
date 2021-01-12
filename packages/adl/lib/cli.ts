#!/usr/bin/env node

import yargs from "yargs";
import { compile } from "../compiler/program.js";

const args = yargs(process.argv.slice(2))
  .help()
  .strict()
  .command(
    "compile <path>",
    "Compile a directory of ADL files.",
    cmd => {
      return cmd
        .positional("path", {
          description:
            "The path to folder containing .adl files",
          type: "string"
        })
        .option("output-file", {
          type: "string",
          describe: "The output file path for the OpenAPI document"
        });
    }
  )
  .option("debug", {
    type: "boolean",
    description: "Output debug log messages."
  })
  .option("verbose", {
    alias: "v",
    type: "boolean",
    description: "Output verbose log messages."
  })
  .demandCommand(1, "You must use one of the supported commands.")
  .argv;

if (args._[0] === "compile" && args.path) {
  try {
    compile(args.path, {
      swaggerOutputFile: args["output-file"]
    });
  } catch (err) {
    console.error(`An error occurred while compiling path '${args.path}':\n\n${err}`);
  }
}
