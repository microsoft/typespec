import { readFile, writeFile } from "fs/promises";
import { globby } from "globby";
import { resolveConfig } from "prettier";
import { PrettierParserError } from "../formatter/parser.js";
import { checkFormatTypeSpec, formatTypeSpec } from "./formatter.js";
import { normalizePath } from "./path-utils.js";

export interface TypeSpecFormatOptions {
  exclude?: string[];
  debug?: boolean;
}

/**
 * Format all the TypeSpec files.
 * @param patterns List of wildcard pattern searching for TypeSpec files.
 */
export async function formatTypeSpecFiles(
  patterns: string[],
  { exclude, debug }: TypeSpecFormatOptions
) {
  const files = await findFiles(patterns, exclude);
  for (const file of files) {
    try {
      await formatTypeSpecFile(file);
    } catch (e) {
      if (e instanceof PrettierParserError) {
        const details = debug ? e.message : "";
        // eslint-disable-next-line no-console
        console.error(`File '${file}' failed to fromat. ${details}`);
      } else {
        throw e;
      }
    }
  }
}

/**
 * Find all the unformatted files.
 * @returns list of files not formatted.
 */
export async function findUnformattedTypeSpecFiles(
  patterns: string[],
  { exclude, debug }: TypeSpecFormatOptions
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
        console.error(`File '${file}' failed to fromat. ${details}`);
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
 * Check the given typespec file is correctly formatted.
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
