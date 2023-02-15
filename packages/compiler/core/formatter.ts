import prettier from "prettier";
import * as typespecPrettierPlugin from "../formatter/index.js";

export function formatTypeSpec(code: string, prettierConfig?: prettier.Options): string {
  const output = prettier.format(code, {
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
  prettierConfig?: prettier.Options
): Promise<boolean> {
  return prettier.check(code, {
    ...prettierConfig,
    parser: "typespec",
    plugins: [typespecPrettierPlugin],
  });
}
