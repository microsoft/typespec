import { abcModule } from "#python/builtins.js";
import { type Children } from "@alloy-js/core";
import { type Interface, type Model } from "@typespec/compiler";
import { ClassExtends } from "./class-extends.js";

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
 * - Type-derived bases (from TypeSpec model inheritance)
 * - Extra bases (for future generics support)
 * - ABC if abstract (always last for proper Python MRO)
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
  const extraBases = [...(props.extraBases ?? [])];

  // Add extends/inheritance from the TypeSpec type if present
  if (props.type) {
    extraBases.push(...ClassExtends({ type: props.type }));
  }

  // Combine explicit bases from props with extraBases (Generic, extends, etc.)
  const allBases = (props.bases ?? []).concat(extraBases);

  // For abstract classes, always include ABC (last for proper MRO)
  if (props.abstract) {
    return [...allBases, abcModule["."]["ABC"]];
  }

  return allBases;
}
