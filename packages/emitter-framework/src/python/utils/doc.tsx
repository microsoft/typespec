import { type Children, type Component, List } from "@alloy-js/core";

/**
 * Normalize various doc sources into a Python doc element.
 * The exact shape of the doc that will be created is determined by the DocComponent parameter.
 *
 * Accepts:
 * - string - split into lines and render as a multi-line docstring
 * - string[] | Children[] - rendered as separate paragraphs
 * - Children (e.g., an explicit Doc component) - returned as-is
 *
 * @param source - The documentation source (string, array, or JSX)
 * @param DocComponent - The Python doc component to use (ClassDoc, FunctionDoc, MethodDoc, etc.)
 * @returns The rendered doc element, or undefined if no documentation
 */
export function createDocElement(
  source: string | string[] | Children | Children[] | undefined,
  DocComponent: Component<{ description: Children[] }>,
): Children | undefined {
  if (!source) {
    return undefined;
  }

  // Doc provided as an array (paragraphs/nodes) - preserve structure
  if (Array.isArray(source)) {
    return <DocComponent description={source as Children[]} />;
  }

  // Doc provided as a string - preserve line breaks
  if (typeof source === "string") {
    const lines = source.split(/\r?\n/);
    return (
      <DocComponent
        description={[
          <List hardline>
            {lines.map((line) => (
              <>{line}</>
            ))}
          </List>,
        ]}
      />
    );
  }

  // Doc provided as JSX - pass through unchanged
  return source as Children;
}
