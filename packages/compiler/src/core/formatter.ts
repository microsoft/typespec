import type { Options } from "prettier";
import YamlPlugin from "prettier/plugins/yaml.js";
import { check, format as prettierFormat } from "prettier/standalone";
import * as typespecPrettierPlugin from "../formatter/index.js";
import type { Node } from "./types.js";
import { getAnyExtensionFromPath } from "./path-utils.js";

export function printTypeSpecNode(node: Node): Promise<string> {
  return format(".", {
    parser: "typespec",
    plugins: [
      {
        ...typespecPrettierPlugin,
        parsers: {
          typespec: {
            ...typespecPrettierPlugin.parsers.typespec,
            parse: () => node,
          },
        },
      },
    ],
  });
}

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
  return runFormatter(prettierFormat, code, formatter, prettierConfig);
}

/**
 * Check the given code is correctly formatted with the given formatter
 * @param code The code to check the format of
 * @param formatter The formatter to use
 * @param prettierConfig Optional config for prettier
 * @returns true if the code is formatted correctly
 * @throws PrettierParserError if the code is not valid
 */
export async function checkFormat(
  code: string,
  formatter: Formatter,
  prettierConfig?: Options,
): Promise<boolean> {
  return runFormatter(check, code, formatter, prettierConfig);
}

async function runFormatter<T>(
  fn: (code: string, options?: Options) => Promise<T>,
  code: string,
  formatter: Formatter,
  prettierConfig?: Options,
): Promise<T> {
  switch (formatter) {
    case "typespec":
      return fn(code, {
        ...prettierConfig,
        parser: "typespec",
        plugins: [typespecPrettierPlugin],
      });
    case "tspconfig":
      return await fn(code, {
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
