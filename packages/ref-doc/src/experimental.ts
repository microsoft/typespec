import { compile, joinPaths, NodeHost } from "@cadl-lang/compiler";
import { mkdir, writeFile } from "fs/promises";
import { renderToDocusaurusMarkdown } from "./emitters/docusaurus.js";
import { extractRefDocs } from "./extractor.js";

/**
 * @experimental this is for experimental and is for internal use only. Breaking change to this API can happen at anytime.
 */
export async function generateDocs(main: string, namespaces: string[], outputDir: string) {
  const program = await compile(NodeHost, main, {
    parseOptions: { comments: true, docs: true },
  });
  const refDoc = extractRefDocs(program, namespaces);
  const files = renderToDocusaurusMarkdown(refDoc);
  await mkdir(outputDir, { recursive: true });
  for (const [name, content] of Object.entries(files)) {
    await writeFile(joinPaths(outputDir, name), content);
  }
}
