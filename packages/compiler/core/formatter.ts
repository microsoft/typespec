import { readFile, writeFile } from "fs/promises";
import glob from "glob";
import prettier from "prettier";
import * as cadlPrettierPlugin from "../formatter/index.js";
import { PrettierParserError } from "../formatter/parser.js";

export async function formatCadl(code: string, prettierConfig?: prettier.Options): Promise<string> {
  const output = prettier.format(code, {
    ...prettierConfig,
    parser: "cadl",
    plugins: [cadlPrettierPlugin],
  });

  return output;
}

/**
 * Check the given is correctly formatted.
 * @returns true if code is formatted correctly.
 */
export async function checkFormatCadl(
  code: string,
  prettierConfig?: prettier.Options
): Promise<boolean> {
  return prettier.check(code, {
    ...prettierConfig,
    parser: "cadl",
    plugins: [cadlPrettierPlugin],
  });
}

/**
 * Format all the Cadl files.
 * @param patterns List of wildcard pattern searching for Cadl files.
 */
export async function formatCadlFiles(patterns: string[], { debug }: { debug?: boolean }) {
  const files = await findFiles(patterns);
  for (const file of files) {
    try {
      await formatCadlFile(file);
    } catch (e) {
      if (e instanceof PrettierParserError) {
        const details = debug ? e.message : "";
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
export async function findUnformattedCadlFiles(
  patterns: string[],
  { debug }: { debug?: boolean }
): Promise<string[]> {
  const files = await findFiles(patterns);
  const unformatted = [];
  for (const file of files) {
    try {
      if (!(await checkFormatCadlFile(file))) {
        unformatted.push(file);
      }
    } catch (e) {
      if (e instanceof PrettierParserError) {
        const details = debug ? e.message : "";
        console.error(`File '${file}' failed to fromat. ${details}`);
        unformatted.push(file);
      } else {
        throw e;
      }
    }
  }
  return unformatted;
}

export async function formatCadlFile(filename: string) {
  const content = await readFile(filename);
  const prettierConfig = await prettier.resolveConfig(filename);
  const formattedContent = await formatCadl(content.toString(), prettierConfig ?? {});
  await writeFile(filename, formattedContent);
}

/**
 * Check the given cadl file is correctly formatted.
 * @returns true if code is formatted correctly.
 */
export async function checkFormatCadlFile(filename: string): Promise<boolean> {
  const content = await readFile(filename);
  const prettierConfig = await prettier.resolveConfig(filename);
  return await checkFormatCadl(content.toString(), prettierConfig ?? {});
}

async function findFilesFromPattern(pattern: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    glob(pattern, (err, matches) => {
      if (err) {
        reject(err);
      }
      resolve(matches);
    });
  });
}

async function findFiles(include: string[]): Promise<string[]> {
  const result = await Promise.all(include.map((path) => findFilesFromPattern(path)));
  return result.flat();
}
