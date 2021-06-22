import { readFile, writeFile } from "fs/promises";
import glob from "glob";
import prettier from "prettier";
import * as adlPrettierPlugin from "../formatter/index.js";
import { PrettierParserError } from "../formatter/parser.js";

export async function formatADL(code: string): Promise<string> {
  const output = prettier.format(code, {
    parser: "adl",
    plugins: [adlPrettierPlugin],
  });
  return output;
}

/**
 * Format all the adl files.
 * @param patterns List of wildcard pattern searching for adl files.
 */
export async function formatADLFiles(patterns: string[], { debug }: { debug?: boolean }) {
  const files = await findFiles(patterns);
  for (const file of files) {
    try {
      await formatADLFile(file);
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

export async function formatADLFile(filename: string) {
  const content = await readFile(filename);
  const formattedContent = await formatADL(content.toString());
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
