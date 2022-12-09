import { compile, joinPaths, NodeHost, normalizePath } from "@cadl-lang/compiler";
import { writeFile } from "fs/promises";
import { resolve } from "path";
import { renderToDocusaurusMarkdown } from "./emitters/docusaurus.js";
import { extractRefDocs } from "./extractor.js";

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

  const program = await compile(NodeHost, main, {
    parseOptions: { comments: true, docs: true },
  });
  const refDoc = extractRefDocs(program, namespaces);
  const files = renderToDocusaurusMarkdown(refDoc);
  for (const [name, content] of Object.entries(files)) {
    writeFile(joinPaths(resolvedOutputDir, name), content);
  }
}
