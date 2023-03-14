import prettier from "prettier";
import * as typespecPrettierPlugin from "../formatter/index.js";
export { printId as formatIdentifier } from "../formatter/print/printer.js";

export function formatTypeSpec(code: string, prettierConfig?: prettier.Options): string {
  const output = prettier.format(code, {
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
  prettierConfig?: prettier.Options
): Promise<boolean> {
  return prettier.check(code, {
    ...prettierConfig,
    parser: "typespec",
    plugins: [typespecPrettierPlugin],
  });
}
