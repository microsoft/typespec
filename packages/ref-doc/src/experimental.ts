import { compile, joinPaths, NodeHost, NodePackage } from "@cadl-lang/compiler";
import { mkdir, readFile, writeFile } from "fs/promises";
import { generateJsApiDocs } from "./api-docs.js";
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

/**
 * @experimental this is for experimental and is for internal use only. Breaking change to this API can happen at anytime.
 */
export async function generateLibraryDocs(
  libraryPath: string,
  namespaces: string[],
  outputDir: string
) {
  const pkgJson = await readPackageJson(libraryPath);
  if (pkgJson.cadlMain) {
    const main = joinPaths(libraryPath, pkgJson.cadlMain);
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
  await generateJsApiDocs(libraryPath, joinPaths(outputDir, "js-api"));
}

async function readPackageJson(libraryPath: string): Promise<NodePackage> {
  const buffer = await readFile(joinPaths(libraryPath, "package.json"));
  return JSON.parse(buffer.toString());
}
