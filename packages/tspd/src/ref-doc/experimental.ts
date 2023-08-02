import {
  compile,
  createDiagnosticCollector,
  Diagnostic,
  joinPaths,
  NodeHost,
  NodePackage,
} from "@typespec/compiler";
import { mkdir, readFile, writeFile } from "fs/promises";
import { generateJsApiDocs } from "./api-docs.js";
import { renderToDocusaurusMarkdown } from "./emitters/docusaurus.js";
import { extractLibraryRefDocs, ExtractRefDocOptions, extractRefDocs } from "./extractor.js";
import { TypeSpecRefDocBase } from "./types.js";

/**
 * @experimental this is for experimental and is for internal use only. Breaking change to this API can happen at anytime.
 */
export async function generateLibraryDocs(
  libraryPath: string,
  outputDir: string,
  skipJSApi: boolean = false
): Promise<readonly Diagnostic[]> {
  const diagnostics = createDiagnosticCollector();
  const pkgJson = await readPackageJson(libraryPath);
  const refDoc = diagnostics.pipe(await extractLibraryRefDocs(libraryPath));
  const files = renderToDocusaurusMarkdown(refDoc);
  await mkdir(outputDir, { recursive: true });
  for (const [name, content] of Object.entries(files)) {
    await writeFile(joinPaths(outputDir, name), content);
  }
  if (pkgJson.main && !skipJSApi) {
    await generateJsApiDocs(libraryPath, joinPaths(outputDir, "js-api"));
  }
  return diagnostics.diagnostics;
}

export async function resolveLibraryRefDocsBase(
  libraryPath: string,
  options: ExtractRefDocOptions = {}
): Promise<[TypeSpecRefDocBase, readonly Diagnostic[]] | undefined> {
  const diagnostics = createDiagnosticCollector();
  const pkgJson = await readPackageJson(libraryPath);
  if (pkgJson.tspMain) {
    const main = joinPaths(libraryPath, pkgJson.tspMain);
    const program = await compile(NodeHost, main, {
      parseOptions: { comments: true, docs: true },
    });
    const refDoc = diagnostics.pipe(extractRefDocs(program, options));
    for (const diag of program.diagnostics ?? []) {
      diagnostics.add(diag);
    }
    return diagnostics.wrap(refDoc);
  }
  return undefined;
}

async function readPackageJson(libraryPath: string): Promise<NodePackage> {
  const buffer = await readFile(joinPaths(libraryPath, "package.json"));
  return JSON.parse(buffer.toString());
}
