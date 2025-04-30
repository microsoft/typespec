import { readFile, writeFile } from "fs/promises";
import { globby } from "globby";
import { resolveConfig } from "prettier";
import { PrettierParserError } from "../formatter/parser.js";
import { checkFormatTypeSpec, format, getFormatterFromFilename } from "./formatter.js";
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
  readonly formattedFiles: string[];

  /** Files that were included in the filter but are not in the scope of the typespec formatter. */
  readonly ignoredFiles: string[];

  /** Files with errors */
  readonly erroredFiles: [string, Diagnostic][];
}

/**
 * Format all the TypeSpec project files(.tsp, tspconfig.yaml).
 * @param patterns List of wildcard pattern searching for TypeSpec files.
 * @returns list of files which failed to format.
 */
export async function formatFiles(
  patterns: string[],
  { exclude }: TypeSpecFormatOptions,
): Promise<TypeSpecFormatResult> {
  const files = await findFiles(patterns, exclude);
  const erroredFiles: [string, Diagnostic][] = [];
  const formattedFiles: string[] = [];
  const ignoredFiles: string[] = [];
  for (const file of files) {
    const result = await formatFile(file);
    switch (result.kind) {
      case "formatted":
        formattedFiles.push(file);
        break;
      case "ignored":
        ignoredFiles.push(file);
        break;
      case "error":
        erroredFiles.push([file, result.diagnostic]);
        break;
    }
  }

  return { formattedFiles, ignoredFiles, erroredFiles };
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

export type FormatFileResult =
  /** File formatted successfully. */
  | { kind: "formatted" }
  /** File is not in a format that can be formatted by TypeSpec */
  | { kind: "ignored" }
  /** Error occurred, probably a parsing error. */
  | { kind: "error"; diagnostic: Diagnostic };

export async function formatFile(filename: string): Promise<FormatFileResult> {
  const content = await readFile(filename, "utf-8");
  const prettierConfig = await resolveConfig(filename);
  const formatter = getFormatterFromFilename(filename);
  if (formatter === undefined) {
    return { kind: "ignored" };
  }
  try {
    const formattedContent = await format(content, formatter, prettierConfig ?? {});
    await writeFile(filename, formattedContent);
    return { kind: "formatted" };
  } catch (e) {
    if (e instanceof PrettierParserError) {
      return {
        kind: "error",
        diagnostic: createDiagnostic({
          code: "format-failed",
          format: { file: filename, details: e.message },
          target: NoTarget,
        }),
      };
    } else {
      throw e;
    }
  }
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
