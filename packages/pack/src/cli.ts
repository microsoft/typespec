try {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  await import("source-map-support/register.js");
} catch {
  // package only present in dev.
}

import { getDirectoryPath, logDiagnostics, NodeHost, normalizePath } from "@typespec/compiler";
import { mkdir, writeFile } from "fs/promises";
import { resolve } from "path";
import { parseArgs } from "util";
import { PackHost } from "./pack-host.js";
import { combineProjectIntoFile } from "./pack.js";

function log(...args: any[]) {
  // eslint-disable-next-line no-console
  console.log(...args);
}
const args = parseArgs({
  options: {},
  args: process.argv.slice(2),
  allowPositionals: true,
});

const entrypoint = args.positionals[0];

const rawEntrypoint =
  entrypoint.startsWith("http://") || entrypoint.startsWith("https://")
    ? entrypoint
    : normalizePath(resolve(entrypoint));

const { content, diagnostics } = await combineProjectIntoFile(PackHost, rawEntrypoint);

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
