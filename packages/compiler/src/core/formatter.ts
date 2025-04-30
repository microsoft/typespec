import type { Options } from "prettier";
import YamlPlugin from "prettier/plugins/yaml.js";
import { check, format as prettierFormat } from "prettier/standalone";
import * as typespecPrettierPlugin from "../formatter/index.js";
import { getAnyExtensionFromPath } from "./path-utils.js";

export type Formatter = "typespec" | "tspconfig";

/**
 * Get the formatter name for the given filename
 * @param filename The filename to check
 */
export function getFormatterFromFilename(filename: string): Formatter | undefined {
  const ext = getAnyExtensionFromPath(filename);
  if (filename.endsWith("tspconfig.yaml")) {
    return "tspconfig";
  }
  switch (ext) {
    case ".tsp":
      return "typespec";
  }
  return undefined;
}

/**
 * Format the code with the given formatter
 * @param code The code to format
 * @param formatter The formatter to use
 * @param prettierConfig Optional config for prettier
 * @returns The formatted code
 * @throws PrettierParserError if the code is not valid
 */
export async function format(
  code: string,
  formatter: Formatter,
  prettierConfig?: Options,
): Promise<string> {
  switch (formatter) {
    case "typespec":
      return formatTypeSpec(code, prettierConfig);
    case "tspconfig":
      return await prettierFormat(code, {
        ...prettierConfig,
        parser: "yaml",
        plugins: [YamlPlugin],
      });
  }
}

/**
 * Format TypeSpec code
 * @param code Code to format
 * @param prettierConfig Optional config for prettier.
 * @returns Formatted code
 */
export async function formatTypeSpec(code: string, prettierConfig?: Options): Promise<string> {
  const output = await prettierFormat(code, {
    ...prettierConfig,
    parser: "typespec",
    plugins: [typespecPrettierPlugin],
  });

  return output;
}

/**
 * Check the given is correctly formatted.
 * @returns true if code is formatted correctly.
 */
export async function checkFormatTypeSpec(
  code: string,
  prettierConfig?: Options,
): Promise<boolean> {
  return check(code, {
    ...prettierConfig,
    parser: "typespec",
    plugins: [typespecPrettierPlugin],
  });
}
