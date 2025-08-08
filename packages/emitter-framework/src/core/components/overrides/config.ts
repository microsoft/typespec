import type { Program, Scalar, Type } from "@typespec/compiler";
import { $ } from "@typespec/compiler/typekit";
import type { ComponentOverridesConfigBase } from "./component-overrides.jsx";

const getOverrideForTypeSym: unique symbol = Symbol.for("ef-ts:getOverrideForType");
const getOverrideForTypeKindSym: unique symbol = Symbol.for("ef-ts:getOverrideForTypeKind");

export type ComponentOverridesConfig = ComponentOverridesClass;
export const ComponentOverridesConfig = function () {
  return new ComponentOverridesClass();
} as {
  new (): ComponentOverridesClass;
  (): ComponentOverridesClass;
};

export class ComponentOverridesClass {
  #typeEmitOptions: Map<Type, ComponentOverridesConfigBase<any>> = new Map();
  #typeKindEmitOptions: Map<Type["kind"], ComponentOverridesConfigBase<any>> = new Map();

  forType<const T extends Type>(type: T, options: ComponentOverridesConfigBase<T>) {
    this.#typeEmitOptions.set(type, options);

    return this;
  }

  forTypeKind<const TKind extends Type["kind"]>(
    typeKind: TKind,
    options: ComponentOverridesConfigBase<Extract<Type, { kind: TKind }>>,
  ) {
    this.#typeKindEmitOptions.set(typeKind, options);

    return this;
  }

  /**
   * @internal
   */
  [getOverrideForTypeSym](program: Program, type: Type) {
    const options = this.#typeEmitOptions.get(type);
    if (options || !$(program).scalar.is(type) /** || isBuiltIn(program, type) */) {
      return options;
    }

    // have a scalar, it's not a built-in scalar, and didn't find options, so
    // see if we have options for a base scalar.
    let currentScalar: Scalar | undefined = type;
    while (
      currentScalar &&
      // !isBuiltIn(program, currentScalar) &&
      !this.#typeEmitOptions.has(currentScalar)
    ) {
      currentScalar = currentScalar?.baseScalar;
    }

    if (!currentScalar) {
      return undefined;
    }

    return this.#typeEmitOptions.get(currentScalar);
  }

  /**
   * @internal
   */
  [getOverrideForTypeKindSym](program: Program, typeKind: Type["kind"]) {
    return this.#typeKindEmitOptions.get(typeKind);
  }
}

export function getOverrideForType(
  program: Program,
  type: Type,
  options?: ComponentOverridesConfig,
) {
  return options?.[getOverrideForTypeSym](program, type);
}

export function getOverridesForTypeKind(
  program: Program,
  typeKind: Type["kind"],
  options?: ComponentOverridesConfig,
) {
  return options?.[getOverrideForTypeKindSym](program, typeKind);
}
