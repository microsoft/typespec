import type { Diagnostic } from "@typespec/compiler";
import { compile, createDiagnosticCollector, joinPaths, NodeHost } from "@typespec/compiler";
import { mkdir, writeFile } from "fs/promises";
import prettier from "prettier";
import { resolveLibraryCompilerOptions } from "../utils/library-config.js";
import { generateJsApiDocs } from "./api-docs.js";
import { renderReadme } from "./emitters/markdown.js";
import { renderToAstroStarlightMarkdown } from "./emitters/starlight.js";
import type { ExtractRefDocOptions } from "./extractor.js";
import { extractLibraryRefDocs, extractRefDocs } from "./extractor.js";
import { writeTypekitDocs } from "./typekit-docs.js";
import type { TypeSpecRefDocBase } from "./types.js";
import { readPackageJson } from "./utils/misc.js";

/** Controls optional outputs of the experimental library documentation workflow. */
export interface GenerateLibraryDocsOptions {
  /** Write typekit pages when JavaScript API generation is enabled and a typekit export exists. */
  typekits?: boolean;
  /** Skip both JavaScript API and typekit pages; TypeSpec pages and the README are still written. */
  skipJSApi?: boolean;
  /** Add `llmstxt: true` front matter to declaration pages, including sub-export pages. */
  llmstxt?: boolean;
  /**
   * Relative directory (from the output dir) where the per-rule reference pages are written.
   * Defaults to `"rules"`. Pass e.g. `"../rules"` to keep rule pages outside the reference folder.
   */
  rulesDir?: string;
}
/**
 * Writes Starlight reference pages and replaces the library's README with a rendered overview.
 * Creates output directories as needed, formats Markdown using the library's Prettier
 * configuration, and optionally generates JavaScript API and typekit pages. Existing files
 * with matching names are overwritten; obsolete generated files are not removed.
 *
 * @returns Collected extraction and compilation diagnostics. I/O and generation failures may throw.
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
  const files = renderToAstroStarlightMarkdown(refDoc, {
    llmstxt: options.llmstxt,
    rulesDir: options.rulesDir,
  });
  await mkdir(outputDir, { recursive: true });
  const config = await prettier.resolveConfig(libraryPath);
  for (const [name, content] of Object.entries(files)) {
    const filePath = joinPaths(outputDir, name);
    // Ensure parent directory exists for sub-export files
    const dir = filePath.substring(0, filePath.lastIndexOf("/"));
    if (dir !== outputDir) {
      await mkdir(dir, { recursive: true });
    }
    const formatted = await formatMarkdown(name, content, config);
    await writeFile(filePath, formatted);
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

/**
 * Compiles the legacy `tspMain` entry from a package.json and extracts its TypeSpec reference model.
 * Returns undefined when `tspMain` is absent; unlike {@link extractLibraryRefDocs}, this does not
 * resolve package exports, JavaScript metadata, or sub-exports.
 * @returns The model and collected diagnostics, or undefined when there is no legacy entry point.
 */
export async function resolveLibraryRefDocsBase(
  libraryPath: string,
  options: ExtractRefDocOptions = {},
): Promise<[TypeSpecRefDocBase, readonly Diagnostic[]] | undefined> {
  const diagnostics = createDiagnosticCollector();
  const pkgJson = await readPackageJson(libraryPath);
  if (pkgJson.tspMain) {
    const main = joinPaths(libraryPath, pkgJson.tspMain);
    const program = await compile(NodeHost, main, {
      ...(await resolveLibraryCompilerOptions(NodeHost, main)),
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
