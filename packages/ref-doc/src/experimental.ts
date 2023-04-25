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
import { extractRefDocs } from "./extractor.js";
import { TypeSpecRefDoc } from "./types.js";

/**
 * @experimental this is for experimental and is for internal use only. Breaking change to this API can happen at anytime.
 */
export async function generateLibraryDocs(
  libraryPath: string,
  namespaces: string[],
  outputDir: string
): Promise<readonly Diagnostic[]> {
  const diagnostics = createDiagnosticCollector();
  const pkgJson = await readPackageJson(libraryPath);
  if (pkgJson.tspMain) {
    const main = joinPaths(libraryPath, pkgJson.tspMain);
    const program = await compile(NodeHost, main, {
      parseOptions: { comments: true, docs: true },
    });
    const refDoc = extractRefDocs(program, namespaces);
    for (const diag of program.diagnostics ?? []) {
      diagnostics.add(diag);
    }
    const files = renderToDocusaurusMarkdown(refDoc);
    await mkdir(outputDir, { recursive: true });
    for (const [name, content] of Object.entries(files)) {
      await writeFile(joinPaths(outputDir, name), content);
    }
  }
  if (pkgJson.main) {
    await generateJsApiDocs(libraryPath, joinPaths(outputDir, "js-api"));
  }
  return diagnostics.diagnostics;
}

export async function resolveLibraryRefDocs(
  libraryPath: string,
  namespaces: string[]
): Promise<[TypeSpecRefDoc, readonly Diagnostic[]] | undefined> {
  const diagnostics = createDiagnosticCollector();
  const pkgJson = await readPackageJson(libraryPath);
  if (pkgJson.tspMain) {
    const main = joinPaths(libraryPath, pkgJson.tspMain);
    const program = await compile(NodeHost, main, {
      parseOptions: { comments: true, docs: true },
    });
    const refDoc = extractRefDocs(program, namespaces);
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
