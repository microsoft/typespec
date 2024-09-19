import { readFile, writeFile } from "fs/promises";
import { globby } from "globby";
import { resolveConfig } from "prettier";
import { PrettierParserError } from "../formatter/parser.js";
import { checkFormatTypeSpec, formatTypeSpec } from "./formatter.js";
import { createDiagnostic } from "./messages.js";
import { normalizePath } from "./path-utils.js";
import { Diagnostic, NoTarget } from "./types.js";

export interface TypeSpecFormatOptions {
  exclude?: string[];
  debug?: boolean;
}

export interface TypeSpecFormatResult {
  /**
   * The list of files which were formatted successfully, the paths of which are either relative or absolute based on the original file path patterns.
   */
  formattedFiles: string[];
}

/**
 * Format all the TypeSpec files.
 * @param patterns List of wildcard pattern searching for TypeSpec files.
 * @returns list of files which failed to format.
 */
export async function formatTypeSpecFiles(
  patterns: string[],
  { exclude, debug }: TypeSpecFormatOptions,
): Promise<[TypeSpecFormatResult, readonly Diagnostic[]]> {
  const files = await findFiles(patterns, exclude);
  const diagnostics: Diagnostic[] = [];
  const formattedFiles: string[] = [];
  for (const file of files) {
    try {
      await formatTypeSpecFile(file);
      formattedFiles.push(file);
    } catch (e) {
      if (e instanceof PrettierParserError) {
        const details = debug ? e.message : "";
        diagnostics.push(
          createDiagnostic({
            code: "format-failed",
            format: { file, details },
            target: NoTarget,
          }),
        );
      } else {
        throw e;
      }
    }
  }

  return [{ formattedFiles }, diagnostics];
}

/**
 * Find all the unformatted files.
 * @returns list of files not formatted.
 */
export async function findUnformattedTypeSpecFiles(
  patterns: string[],
  { exclude, debug }: TypeSpecFormatOptions,
): Promise<string[]> {
  const files = await findFiles(patterns, exclude);
  const unformatted = [];
  for (const file of files) {
    try {
      if (!(await checkFormatTypeSpecFile(file))) {
        unformatted.push(file);
      }
    } catch (e) {
      if (e instanceof PrettierParserError) {
        const details = debug ? e.message : "";
        // eslint-disable-next-line no-console
        console.error(`File '${file}' failed to format. ${details}`);
        unformatted.push(file);
      } else {
        throw e;
      }
    }
  }
  return unformatted;
}

export async function formatTypeSpecFile(filename: string) {
  const content = await readFile(filename, "utf-8");
  const prettierConfig = await resolveConfig(filename);
  const formattedContent = await formatTypeSpec(content, prettierConfig ?? {});
  await writeFile(filename, formattedContent);
}

/**
 * Check the given TypeSpec file is correctly formatted.
 * @returns true if code is formatted correctly.
 */
export async function checkFormatTypeSpecFile(filename: string): Promise<boolean> {
  const content = await readFile(filename, "utf-8");
  const prettierConfig = await resolveConfig(filename);
  return await checkFormatTypeSpec(content, prettierConfig ?? {});
}

async function findFiles(include: string[], ignore: string[] = []): Promise<string[]> {
  const patterns = [
    ...include.map(normalizePath),
    "!**/node_modules",
    ...ignore.map((x) => `!${normalizePath(x)}`),
  ];
  return globby(patterns);
}
