import prettier from "prettier";
import * as cadlPrettierPlugin from "../formatter/index.js";

export function formatCadl(code: string, prettierConfig?: prettier.Options): string {
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
