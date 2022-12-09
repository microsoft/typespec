import { compile, NodeHost, normalizePath } from "@cadl-lang/compiler";
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
  const namespace = args[1];
  if (entrypoint === undefined) {
    console.error("Specify doc entrypoint");
    process.exit(1);
  }
  const main = normalizePath(resolve(entrypoint));
  console.log(`Generate docs for ${main}`);

  const program = await compile(NodeHost, main, {
    parseOptions: { comments: true, docs: true },
  });
  const refDoc = extractRefDocs(program);
  const files = renderToDocusaurusMarkdown(refDoc);
  for (const [name, content] of Object.entries(files)) {
    writeFile(name, content);
  }
}
