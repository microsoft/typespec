import { compile, joinPaths, NodeHost, NodePackage } from "@typespec/compiler";
import { mkdir, readFile, writeFile } from "fs/promises";
import { generateJsApiDocs } from "./api-docs.js";
import { renderToDocusaurusMarkdown } from "./emitters/docusaurus.js";
import { extractRefDocs } from "./extractor.js";
import { TypeSpecRefDoc } from "./types.js";

/**
 * @experimental this is for experimental and is for internal use only. Breaking change to this API can happen at anytime.
 */
export async function generateLibraryDocs(
  libraryPath: string,
  namespaces: string[],
  outputDir: string
) {
  const pkgJson = await readPackageJson(libraryPath);
  if (pkgJson.tspMain) {
    const main = joinPaths(libraryPath, pkgJson.tspMain);
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
  if (pkgJson.main) {
    await generateJsApiDocs(libraryPath, joinPaths(outputDir, "js-api"));
  }
}

export async function resolveLibraryRefDocs(
  libraryPath: string,
  namespaces: string[]
): Promise<TypeSpecRefDoc | undefined> {
  const pkgJson = await readPackageJson(libraryPath);
  if (pkgJson.tspMain) {
    const main = joinPaths(libraryPath, pkgJson.tspMain);
    const program = await compile(NodeHost, main, {
      parseOptions: { comments: true, docs: true },
    });
    return extractRefDocs(program, namespaces);
  }
  return undefined;
}

async function readPackageJson(libraryPath: string): Promise<NodePackage> {
  const buffer = await readFile(joinPaths(libraryPath, "package.json"));
  return JSON.parse(buffer.toString());
}
