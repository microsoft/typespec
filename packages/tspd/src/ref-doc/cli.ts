/* eslint-disable no-console */
import { normalizePath } from "@typespec/compiler";
import { resolve } from "path";
import { generateLibraryDocs } from "./index.js";

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

async function main() {
  const args = process.argv.slice(2);
  const entrypoint = args[0];
  const outputDir = args[1];
  const namespaces = args.slice(2);
  if (entrypoint === undefined) {
    console.error("Specify doc entrypoint as 1st parameter");
    process.exit(1);
  }
  if (outputDir === undefined) {
    console.error("Specify output-dir as 2nd parameter");
    process.exit(1);
  }
  const main = normalizePath(resolve(entrypoint));
  const resolvedOutputDir = normalizePath(resolve(outputDir));
  console.log(`Generate docs`, {
    main,
    resolvedOutputDir,
  });

  await generateLibraryDocs(main, namespaces, resolvedOutputDir);
}
