import { readFile, writeFile } from "fs/promises";
import glob from "glob";
import prettier from "prettier";
import * as cadlPrettierPlugin from "../formatter/index.js";
import { PrettierParserError } from "../formatter/parser.js";

export async function formatCadl(code: string): Promise<string> {
  const output = prettier.format(code, {
    parser: "cadl",
    plugins: [cadlPrettierPlugin],
  });
  return output;
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

export async function formatCadlFile(filename: string) {
  const content = await readFile(filename);
  const formattedContent = await formatCadl(content.toString());
  await writeFile(filename, formattedContent);
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
