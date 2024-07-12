import {
  compile,
  getLocationContext,
  normalizePath,
  printTypeSpecNode,
  type TypeSpecScriptNode,
} from "@typespec/compiler";
import { resolve } from "path";
import pc from "picocolors";
import { parseArgs } from "util";
import { ImporterHost } from "./importer-host.js";

function log(...args: any[]) {
  // eslint-disable-next-line no-console
  console.log(...args);
}
const result = parseArgs({
  options: {},
  args: process.argv.slice(2),
  allowPositionals: true,
});

const entrypoint = normalizePath(resolve(result.positionals[0]));

const program = await compile(ImporterHost, entrypoint);

const errors = [];
const libraries = new Set<string>();

for (const [name, file] of program.jsSourceFiles) {
  const locContext = getLocationContext(program, file);
  switch (locContext.type) {
    case "project":
      errors.push(`Importer doesn't support JS files in project: ${name}`);
      break;
    case "library":
      libraries.add(locContext.metadata.name);
      break;
    case "compiler":
    // do nothing
  }
}

const sourceFiles: TypeSpecScriptNode[] = [];
for (const file of program.sourceFiles.values()) {
  const locContext = getLocationContext(program, file);
  switch (locContext.type) {
    case "project":
      sourceFiles.push(file);
      break;
    case "library":
      libraries.add(locContext.metadata.name);
      break;
    case "compiler":
    // do nothing
  }
}

// console.log(
//   "Source files:",
//   sourceFiles.map((x) => x.file.path)

for (const file of sourceFiles) {
  const result = await printTypeSpecNode(file);
  console.log("Result:----\n", result);
}

if (errors.length > 0) {
  for (const error of errors) {
    log(pc.red(error));
  }
  process.exit(1);
}
