import { abcModule } from "#python/builtins.js";
import { type Children } from "@alloy-js/core";
import * as py from "@alloy-js/python";
import { isTemplateDeclarationOrInstance, type Interface, type Model } from "@typespec/compiler";
import { useTsp } from "../../../core/context/tsp-context.js";
import { efRefkey } from "../../utils/refkey.js";
import { TypeExpression } from "../type-expression/type-expression.js";

export interface ClassBasesProps {
  /**
   * The TypeSpec type to derive bases from. If not provided, only explicit bases are used.
   */
  type?: Model | Interface;

  /**
   * Explicit base classes to include.
   */
  bases?: Children[];

  /**
   * Whether the class is abstract. If true, ABC is added to the bases.
   */
  abstract?: boolean;

  /**
   * Additional bases to include (e.g., for future Generic[T] support).
   */
  extraBases?: Children[];
}

/**
 * Computes the base classes for a Python class declaration.
 *
 * Combines:
 * - Explicit bases from props
 * - Type-derived bases (from TypeSpec model inheritance):
 *   - Template instances (e.g., `Response<string>` → `Response[str]`)
 *   - Regular models (e.g., `BaseWidget`) via py.Reference
 *   - Arrays via TypeExpression for `typing.Sequence[T]` rendering
 *   - Records are not supported and ignored
 * - Extra bases (for future generics support)
 * - ABC if abstract (always last for proper Python MRO)
 *
 * For interfaces, type-derived bases are empty because TypeSpec flattens interface inheritance.
 *
 * @returns Array of base class Children, or empty array if none.
 *
 * @example
 * ```tsx
 * const bases = ClassBases({ type: model, abstract: true });
 * <py.ClassDeclaration bases={bases.length ? bases : undefined} />
 * ```
 */
export function ClassBases(props: ClassBasesProps): Children[] {
  const { $ } = useTsp();
  const extraBases = [...(props.extraBases ?? [])];

  // Add extends/inheritance from the TypeSpec type if present
  if (props.type && $.model.is(props.type)) {
    const type = props.type;

    if (type.baseModel) {
      if ($.array.is(type.baseModel)) {
        extraBases.push(<TypeExpression type={type.baseModel} />);
      } else if ($.record.is(type.baseModel)) {
        // Record-based scenarios are not supported, do nothing here
      } else if (isTemplateDeclarationOrInstance(type.baseModel)) {
        // Template type (declaration or instance) - needs TypeExpression for type parameter handling
        extraBases.push(<TypeExpression type={type.baseModel} />);
      } else {
        // Regular model - use py.Reference for proper symbol resolution
        extraBases.push(<py.Reference refkey={efRefkey(type.baseModel)} />);
      }
    }

    // Handle index types: Arrays (int indexes) are supported, Records are not
    const indexType = $.model.getIndexType(type);
    if (indexType && !$.record.is(indexType)) {
      extraBases.push(<TypeExpression type={indexType} />);
    }
  }

  // Combine explicit bases from props with extraBases (Generic, extends, etc.)
  const allBases = (props.bases ?? []).concat(extraBases);

  // For abstract classes, always include ABC (last for proper MRO)
  if (props.abstract) {
    return [...allBases, abcModule["."]["ABC"]];
  }

  return allBases;
}
