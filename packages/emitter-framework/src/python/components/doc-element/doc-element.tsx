import { type Children, type Component, List } from "@alloy-js/core";
import type { Type } from "@typespec/compiler";
import { useTsp } from "../../../core/context/tsp-context.js";

export interface DocElementProps {
  /**
   * The TypeSpec type to get documentation from.
   * If provided and no `doc` override is given, documentation will be
   * fetched via `$.type.getDoc(type)`.
   */
  type?: Type;

  /**
   * Optional documentation override. If provided, this takes precedence
   * over documentation from the `type` prop.
   *
   * Accepts:
   * - string - split into lines and render as a multi-line docstring
   * - string[] | Children[] - rendered as separate paragraphs
   * - Children (e.g., an explicit Doc component) - returned as-is
   */
  doc?: string | string[] | Children | Children[];

  /**
   * The Python doc component to use for rendering (ClassDoc, FunctionDoc, MethodDoc, etc.)
   */
  component: Component<{ description: Children[] }>;
}

/**
 * Renders documentation for a Python declaration.
 *
 * This component handles fetching documentation from TypeSpec types and
 * normalizing various doc formats into the appropriate Python doc component.
 *
 * @example
 * ```tsx
 * // With a TypeSpec type (fetches doc automatically)
 * <DocElement type={model} component={py.ClassDoc} />
 *
 * // With an explicit doc override
 * <DocElement doc="My custom documentation" component={py.FunctionDoc} />
 *
 * // With both (doc takes precedence)
 * <DocElement type={model} doc={props.doc} component={py.ClassDoc} />
 * ```
 */
export function DocElement(props: DocElementProps): Children {
  const { $ } = useTsp();

  // Resolve the documentation source: explicit doc takes precedence over type-derived doc
  const source = props.doc ?? (props.type ? $.type.getDoc(props.type) : undefined);

  if (!source) {
    return undefined;
  }

  const DocComponent = props.component;

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
