import type { Options } from "prettier";
import { check, format } from "prettier/standalone";
import * as typespecPrettierPlugin from "../formatter/index.js";

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
  prettierConfig?: Options,
): Promise<boolean> {
  return check(code, {
    ...prettierConfig,
    parser: "typespec",
    plugins: [typespecPrettierPlugin],
  });
}
