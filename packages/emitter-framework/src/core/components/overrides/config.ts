import type { Program, Scalar, Type } from "@typespec/compiler";
import { $ } from "@typespec/compiler/typekit";
import type {
  Experimental_ComponentOverridesConfigBase,
  Experimental_DefaultDeclarationProps,
} from "./component-overrides.jsx";

const getOverrideForTypeSym: unique symbol = Symbol.for("ef-ts:getOverrideForType");
const getOverrideForTypeKindSym: unique symbol = Symbol.for("ef-ts:getOverrideForTypeKind");

/**
 * The ways a type can be rendered, and therefore overridden.
 */
export type Experimental_OverrideKind = keyof Experimental_ComponentOverridesConfigBase<any, any>;

/** Callback for one rendering role; absent registrations resolve to `undefined`. */
type OverrideComponent<K extends Experimental_OverrideKind> =
  Experimental_ComponentOverridesConfigBase<any, any>[K];

/** Mutable override registry accepted by {@link Experimental_ComponentOverrides}. */
export type Experimental_ComponentOverridesConfig = Experimental_ComponentOverridesClass;
/** Creates an empty override registry; callable with or without `new`. */
export const Experimental_ComponentOverridesConfig = function () {
  return new Experimental_ComponentOverridesClass();
} as {
  new (): Experimental_ComponentOverridesClass;
  (): Experimental_ComponentOverridesClass;
};

/**
 * Registers replacement renderers by TypeSpec object identity or type kind.
 * Type-specific registrations take precedence over kind registrations, independently
 * for references and declarations. Scalars also inherit registrations from base scalars.
 */
export class Experimental_ComponentOverridesClass {
  #typeEmitOptions: Map<Type, Experimental_ComponentOverridesConfigBase<any, any>> = new Map();
  #typeKindEmitOptions: Map<Type["kind"], Experimental_ComponentOverridesConfigBase<any, any>> =
    new Map();

  /**
   * Replaces the registration for this exact type and returns this registry for chaining.
   * Supply the language component's declaration props as `TDeclarationProps` to type-check
   * a declaration override. Unspecified rendering roles fall back during resolution.
   */
  forType<const T extends Type, TDeclarationProps = Experimental_DefaultDeclarationProps>(
    type: T,
    options: Experimental_ComponentOverridesConfigBase<T, TDeclarationProps>,
  ) {
    this.#typeEmitOptions.set(type, options);

    return this;
  }

  /**
   * Replaces the fallback registration for a TypeSpec kind and returns this registry.
   * Applies only when no type-specific (or inherited scalar) override exists for that role.
   */
  forTypeKind<
    const TKind extends Type["kind"],
    TDeclarationProps = Experimental_DefaultDeclarationProps,
  >(
    typeKind: TKind,
    options: Experimental_ComponentOverridesConfigBase<
      Extract<Type, { kind: TKind }>,
      TDeclarationProps
    >,
  ) {
    this.#typeKindEmitOptions.set(typeKind, options);

    return this;
  }

  /**
   * Look up the override for a single override kind, walking up the scalar hierarchy when the
   * type is a scalar. Resolution is per override kind, so a derived scalar that only overrides
   * `reference` does not hide a `declaration` override registered on its base scalar.
   *
   * @internal
   */
  [getOverrideForTypeSym]<K extends Experimental_OverrideKind>(
    program: Program,
    type: Type,
    overrideKind: K,
  ): OverrideComponent<K> {
    const own = this.#typeEmitOptions.get(type)?.[overrideKind];
    if (own || !$(program).scalar.is(type) /** || isBuiltIn(program, type) */) {
      return own;
    }

    // have a scalar, it's not a built-in scalar, and didn't find an override, so
    // see if a base scalar has one.
    let currentScalar: Scalar | undefined = type.baseScalar;
    while (currentScalar /** && !isBuiltIn(program, currentScalar) */) {
      const inherited = this.#typeEmitOptions.get(currentScalar)?.[overrideKind];
      if (inherited) {
        return inherited;
      }
      currentScalar = currentScalar.baseScalar;
    }

    return undefined;
  }

  /**
   * @internal
   */
  [getOverrideForTypeKindSym]<K extends Experimental_OverrideKind>(
    typeKind: Type["kind"],
    overrideKind: K,
  ): OverrideComponent<K> {
    return this.#typeKindEmitOptions.get(typeKind)?.[overrideKind];
  }
}

/**
 * Resolve the component that overrides how `type` is rendered for the given override kind.
 *
 * Precedence is resolved independently per override kind: a type-level override that only
 * defines `reference` does not prevent a kind-level `declaration` override from applying, and
 * vice versa.
 */
export function getOverrideComponent<K extends Experimental_OverrideKind>(
  program: Program,
  type: Type,
  overrideKind: K,
  options?: Experimental_ComponentOverridesConfig,
): OverrideComponent<K> {
  return (
    options?.[getOverrideForTypeSym](program, type, overrideKind) ??
    options?.[getOverrideForTypeKindSym](type.kind, overrideKind)
  );
}
