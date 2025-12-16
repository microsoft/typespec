import { type Children } from "@alloy-js/core";
import * as py from "@alloy-js/python";
import { isTemplateDeclarationOrInstance, type Interface, type Model } from "@typespec/compiler";
import { useTsp } from "../../../core/context/tsp-context.js";
import { efRefkey } from "../../utils/refkey.js";
import { TypeExpression } from "../type-expression/type-expression.js";

export interface ClassExtendsProps {
  /**
   * The TypeSpec type to derive extends from.
   */
  type: Model | Interface;
}

/**
 * Computes the base classes that a Python class should extend based on a TypeSpec type.
 *
 * Handles:
 * - Template instances (e.g., `Response<string>` → `Response[str]`) - Use TypeExpression
 * - Partial templates (e.g., `Response<T>` → `Response[T]`) - Use TypeExpression
 * - Regular models (e.g., `BaseWidget`) - Use py.Reference for symbol resolution
 * - Arrays - Use TypeExpression for `typing.Sequence[T]` rendering
 * - Records - Not supported, ignored
 *
 * For interfaces, returns empty array because TypeSpec flattens interface inheritance.
 *
 * @returns Array of base class Children to extend, or empty array if none.
 *
 * @example
 * ```tsx
 * const extends = ClassExtends({ type: model });
 * // Returns: [<py.Reference refkey={...} />] for a model with baseModel
 * ```
 */
export function ClassExtends(props: ClassExtendsProps): Children[] {
  const { $ } = useTsp();
  const { type } = props;

  // For interfaces, return empty because inheritance is flattened by TypeSpec
  if (!$.model.is(type)) {
    return [];
  }

  const extending: Children[] = [];

  if (type.baseModel) {
    if ($.array.is(type.baseModel)) {
      extending.push(<TypeExpression type={type.baseModel} />);
    } else if ($.record.is(type.baseModel)) {
      // Record-based scenarios are not supported, do nothing here
    } else if (isTemplateDeclarationOrInstance(type.baseModel)) {
      // Template type (declaration or instance) - needs TypeExpression for type parameter handling
      // This covers: Response<string>, Response<T>, and other templated scenarios
      extending.push(<TypeExpression type={type.baseModel} />);
    } else {
      // Regular model - use py.Reference for proper symbol resolution
      extending.push(<py.Reference refkey={efRefkey(type.baseModel)} />);
    }
  }

  // Handle index types: Arrays (int indexes) are supported, while Records (string indexes) are not
  // Note: TypeSpec prevents array models from having properties, so indexType is only for empty arrays
  const indexType = $.model.getIndexType(type);
  if (indexType && !$.record.is(indexType)) {
    extending.push(<TypeExpression type={indexType} />);
  }

  return extending;
}
