try {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  await import("source-map-support/register.js");
} catch {
  // package only present in dev.
}

import { getDirectoryPath, logDiagnostics, NodeHost } from "@typespec/compiler";
import { mkdir, writeFile } from "fs/promises";
import { parseArgs } from "util";
import { combineProjectIntoFile } from "./importer.js";

function log(...args: any[]) {
  // eslint-disable-next-line no-console
  console.log(...args);
}
const args = parseArgs({
  options: {},
  args: process.argv.slice(2),
  allowPositionals: true,
});

const rawEntrypoint = args.positionals[0];

const { content, diagnostics } = await combineProjectIntoFile(rawEntrypoint);

if (diagnostics.length > 0) {
  logDiagnostics(diagnostics, NodeHost.logSink);
  process.exit(1);
}
if (content) {
  const outputFile = "tsp-output/main.tsp";
  await mkdir(getDirectoryPath(outputFile), { recursive: true });
  log(`Writing output to ${outputFile}`);
  await writeFile(outputFile, content);
  process.exit(0);
} else {
  process.exit(1);
}
