import { readFile, writeFile } from "fs/promises";
import { globby } from "globby";
import { resolveConfig } from "prettier";
import { PrettierParserError } from "../formatter/parser.js";
import { checkFormat, format, getFormatterFromFilename } from "./formatter.js";
import { createDiagnostic } from "./messages.js";
import { normalizePath } from "./path-utils.js";
import { Diagnostic, NoTarget } from "./types.js";

export interface TypeSpecFormatOptions {
  exclude?: string[];
}

/**  The paths of which are either relative or absolute based on the original file path patterns. */
export interface TypeSpecFormatResult {
  /** Files which were formatted successfully, */
  readonly formatted: string[];
  /** Files which had a valid format already. */
  readonly alreadyFormatted: string[];
  /** Files that were included in the filter but are not in the scope of the typespec formatter. */
  readonly ignored: string[];
  /** Files with errors */
  readonly errored: [string, Diagnostic][];
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
  const errored: [string, Diagnostic][] = [];
  const formatted: string[] = [];
  const alreadyFormatted: string[] = [];
  const ignored: string[] = [];
  for (const file of files) {
    const result = await formatFile(file);
    switch (result.kind) {
      case "formatted":
        formatted.push(file);
        break;
      case "already-formatted":
        alreadyFormatted.push(file);
        break;
      case "ignored":
        ignored.push(file);
        break;
      case "error":
        errored.push([file, result.diagnostic]);
        break;
    }
  }

  return { formatted, ignored, errored, alreadyFormatted };
}

export interface CheckFilesFormatResult {
  readonly formatted: string[];
  readonly needsFormat: string[];
  readonly ignored: string[];
  readonly errored: [string, Diagnostic][];
}
/**
 * Check the format of the files in the given pattern.
 */
export async function checkFilesFormat(
  patterns: string[],
  { exclude }: TypeSpecFormatOptions,
): Promise<CheckFilesFormatResult> {
  const files = await findFiles(patterns, exclude);
  const errored: [string, Diagnostic][] = [];
  const formatted: string[] = [];
  const needsFormat: string[] = [];
  const ignored: string[] = [];
  for (const file of files) {
    const result = await checkFileFormat(file);
    switch (result.kind) {
      case "formatted":
        formatted.push(file);
        break;
      case "needs-format":
        formatted.push(file);
        break;
      case "ignored":
        ignored.push(file);
        break;
      case "error":
        errored.push([file, result.diagnostic]);
        break;
    }
  }

  return { formatted, needsFormat, ignored, errored };
}

export type FormatFileResult =
  /** File formatted successfully. */
  | { kind: "formatted" }
  /** File was already formatted. */
  | { kind: "already-formatted" }
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
    if (formattedContent === content) {
      return { kind: "already-formatted" };
    }
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

export type CheckFormatResult =
  /** File formatted successfully. */
  | { kind: "formatted" }
  /** File needs format */
  | { kind: "needs-format" }
  /** File is not in a format that can be formatted by TypeSpec */
  | { kind: "ignored" }
  /** Error occurred, probably a parsing error. */
  | { kind: "error"; diagnostic: Diagnostic };

/**
 * Check the given TypeSpec file is correctly formatted.
 */
export async function checkFileFormat(filename: string): Promise<CheckFormatResult> {
  const content = await readFile(filename, "utf-8");
  const prettierConfig = await resolveConfig(filename);
  const formatter = getFormatterFromFilename(filename);
  if (formatter === undefined) {
    return { kind: "ignored" };
  }
  try {
    const formatted = await checkFormat(content, formatter, prettierConfig ?? {});
    return { kind: formatted ? "formatted" : "needs-format" };
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

async function findFiles(include: string[], ignore: string[] = []): Promise<string[]> {
  const patterns = [
    ...include.map(normalizePath),
    "!**/node_modules",
    ...ignore.map((x) => `!${normalizePath(x)}`),
  ];
  return globby(patterns);
}
