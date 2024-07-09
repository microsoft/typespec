import { parseArgs } from "util";
import { ConvertCliArgs } from "./actions/convert/args.js";
import { convertAction } from "./actions/convert/convert-file.js";
import { createCliHost } from "./utils.js";

export async function main() {
  const cliArgs = parseCliArgs();
  const host = createCliHost();

  return convertAction(host, cliArgs);
}

const cliUsage = `tsp-openapi3 <path/to/openapi3/file> --output-dir <path/to/output/directory>`;

function parseCliArgs(): ConvertCliArgs {
  const options = parseArgs({
    args: process.argv.slice(2),
    options: {
      help: {
        type: "boolean",
      },
      "output-dir": {
        type: "string",
      },
    },
    allowPositionals: true,
  });

  // Show help first
  if (options.values.help) {
    displayHelp();
    process.exit(0);
  }

  const diagnostics: string[] = [];
  if (!options.values["output-dir"]) {
    diagnostics.push("Missing required argument: --output-dir");
  }
  if (!options.positionals.length) {
    diagnostics.push("Missing required positional argument: <path>");
  } else if (options.positionals.length !== 1) {
    diagnostics.push(
      `Incorrect number of positional arguments provided for path: got ${options.positionals.length}, need 1`
    );
  }

  if (diagnostics.length > 0) {
    // eslint-disable-next-line no-console
    console.log(cliUsage);
    // eslint-disable-next-line no-console
    console.log(`\n${diagnostics.join("\n")}`);
    process.exit(1);
  }

  return {
    "output-dir": options.values["output-dir"]!,
    path: options.positionals[0],
  };
}

function displayHelp() {
  // eslint-disable-next-line no-console
  const log = console.log;
  log(cliUsage);
  log(`\nConvert OpenAPI3 to TypeSpec`);
  log(`\nPositionals:`);
  log(
    padArgumentUsage(
      "path",
      "The path to the OpenAPI3 file in JSON or YAML format.",
      "[string] [required]"
    )
  );
  log(`\nOptions:`);
  log(padArgumentUsage("--help", "Show help.", "[boolean]"));
  log(
    padArgumentUsage(
      "--output-dir",
      "The output directory for generated TypeSpec files. Will be created if it does not exist.",
      "[string] [required]"
    )
  );
}

function padArgumentUsage(name: string, description: string, type: string) {
  // Assume 80 col width
  // 14 for name, 20 for type, leaves 40 (with spacing) for description
  return `  ${name.padEnd(14)} ${description.padEnd(40)} ${type.padStart(20)}`;
}
