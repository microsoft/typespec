import type { Options } from "prettier";
import { check, format } from "prettier/standalone";
import * as typespecPrettierPlugin from "../formatter/index.js";
import type { Node } from "./types.js";

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

export async function formatTypeSpec(code: string, prettierConfig?: Options): Promise<string> {
  const output = await format(code, {
    ...prettierConfig,
    parser: "typespec",
    plugins: [typespecPrettierPlugin],
  });

  return output;
}

/** @deprecated use checkFormatTypeSpec */
export const checkFormatCadl = checkFormatTypeSpec;

/**
 * Check the given is correctly formatted.
 * @returns true if code is formatted correctly.
 */
export async function checkFormatTypeSpec(
  code: string,
  prettierConfig?: Options
): Promise<boolean> {
  return check(code, {
    ...prettierConfig,
    parser: "typespec",
    plugins: [typespecPrettierPlugin],
  });
}
