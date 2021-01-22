#!/usr/bin/env node

import url from "url";
import yargs from "yargs";
import mkdirp from "mkdirp";
import * as path from "path";
import { compile } from "../compiler/program.js";
import { spawnSync } from "child_process";
import { CompilerOptions } from "../compiler/options.js";

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
        .option("output-path", {
          type: "string",
          default: "./adl-output",
          describe: "The output path for generated artifacts.  If it does not exist, it will be created."
        });
    }
  )
  .command(
    "generate <path>",
    "Generate client and server code from a directory of ADL files.",
    cmd => {
      return cmd
        .positional("path", {
          description:
            "The path to folder containing .adl files",
          type: "string"
        })
        .option("client", {
          type: "boolean",
          describe: "Generate a client library for the ADL definition"
        })
        .option("output-path", {
          type: "string",
          default: "./adl-output",
          describe: "The output path for generated artifacts.  If it does not exist, it will be created."
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

async function compileInput(compilerOptions: CompilerOptions): Promise<void> {
  try {
    await compile(args.path!, compilerOptions);
  } catch (err) {
    console.error(`An error occurred while compiling path '${args.path}':\n\n${err.message}`);
    if (args["debug"]) {
      console.error(`Stack trace:\n\n${err.stack}`);
    }
  }
}

async function getCompilerOptions(): Promise<CompilerOptions> {
  // Ensure output path
  await mkdirp(path.resolve(args["output-path"]));

  return {
    swaggerOutputFile: path.resolve(args["output-path"], "openapi.json")
  };
}

async function main() {

  if (args._[0] === "compile") {
    const options = await getCompilerOptions();
    await compileInput(options);
  } else if (args._[0] === "generate") {
    const options = await getCompilerOptions();
    await compileInput(options);

    if (args.client) {
      const clientPath = path.resolve(args["output-path"], "client");
      const autoRestBin =
        process.platform === "win32"
          ? "autorest.cmd"
          : "autorest"
      const autoRestPath = new url.URL(`../../node_modules/.bin/${autoRestBin}`, import.meta.url);

      // Execute AutoRest on the output file
      // TODO: Parameterize client language selection
      spawnSync(url.fileURLToPath(autoRestPath), [
        "--version:3.0.6367",
        "--typescript",
        `--clear-output-folder=true`,
        `--output-folder=${clientPath}`,
        `--title=AdlClient`,
        `--input-file=${options.swaggerOutputFile}`
      ], {
          stdio: 'inherit',
          shell: true
      });
    }
  }
}

main()
  .then(() => {})
  .catch((err) => {
    console.error(`An unknown error occurred:\n\n${err.message}`);
    if (args["debug"]) {
      console.error(`Stack trace:\n\n${err.stack}`);
    }
  });
