import {
  compile,
  createDiagnosticCollector,
  Diagnostic,
  joinPaths,
  NodeHost,
} from "@typespec/compiler";
import { mkdir, writeFile } from "fs/promises";
import prettier from "prettier";
import { generateJsApiDocs } from "./api-docs.js";
import { renderReadme } from "./emitters/markdown.js";
import { renderToAstroStarlightMarkdown } from "./emitters/starlight.js";
import { extractLibraryRefDocs, ExtractRefDocOptions, extractRefDocs } from "./extractor.js";
import { writeTypekitDocs } from "./typekit-docs.js";
import { TypeSpecRefDocBase } from "./types.js";
import { readPackageJson } from "./utils/misc.js";

export interface GenerateLibraryDocsOptions {
  typekits?: boolean;
  skipJSApi?: boolean;
  llmstxt?: boolean;
}
/**
 * @experimental this is for experimental and is for internal use only. Breaking change to this API can happen at anytime.
 */
export async function generateLibraryDocs(
  libraryPath: string,
  outputDir: string,
  options: GenerateLibraryDocsOptions = {},
): Promise<readonly Diagnostic[]> {
  const diagnostics = createDiagnosticCollector();
  const pkgJson = await readPackageJson(libraryPath);
  const refDoc = diagnostics.pipe(await extractLibraryRefDocs(libraryPath));
  const files = renderToAstroStarlightMarkdown(refDoc, options);
  await mkdir(outputDir, { recursive: true });
  const config = await prettier.resolveConfig(libraryPath);
  for (const [name, content] of Object.entries(files)) {
    const formatted = await formatMarkdown(name, content, config);
    await writeFile(joinPaths(outputDir, name), formatted);
  }
  const readme = await formatMarkdown(
    joinPaths(libraryPath, "README.md"),
    await renderReadme(refDoc, libraryPath),
    config ?? {},
  );
  await writeFile(joinPaths(libraryPath, "README.md"), readme);
  if (!options.skipJSApi) {
    if (options.typekits) {
      await writeTypekitDocs(libraryPath, outputDir);
    }
    if (pkgJson.main) {
      await generateJsApiDocs(libraryPath, joinPaths(outputDir, "js-api"));
    }
  }
  return diagnostics.diagnostics;
}

export async function resolveLibraryRefDocsBase(
  libraryPath: string,
  options: ExtractRefDocOptions = {},
): Promise<[TypeSpecRefDocBase, readonly Diagnostic[]] | undefined> {
  const diagnostics = createDiagnosticCollector();
  const pkgJson = await readPackageJson(libraryPath);
  if (pkgJson.tspMain) {
    const main = joinPaths(libraryPath, pkgJson.tspMain);
    const program = await compile(NodeHost, main, {
      parseOptions: { comments: true, docs: true },
    });
    const refDoc = diagnostics.pipe(await extractRefDocs(program, options));
    for (const diag of program.diagnostics ?? []) {
      diagnostics.add(diag);
    }
    return diagnostics.wrap(refDoc);
  }
  return undefined;
}

async function formatMarkdown(
  filename: string,
  content: string,
  options: prettier.Options | null,
): Promise<string> {
  try {
    return await prettier.format(content, {
      ...(options ?? {}),
      parser: "markdown",
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(`Cannot format with prettier ${filename}`, e);
    return content;
  }
}
