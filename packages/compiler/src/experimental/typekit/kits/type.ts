import { getDiscriminatedUnion } from "../../../core/helpers/discriminator-utils.js";
import {
  Discriminator,
  getDiscriminator,
  getMaxLength,
  getMaxValue,
  getMinLength,
  getMinValue,
} from "../../../core/intrinsic-type-state.js";
import { isErrorType } from "../../../core/type-utils.js";
import { Enum, Model, Scalar, Union, type Namespace, type Type } from "../../../core/types.js";
import { getDoc, getSummary } from "../../../lib/decorators.js";
import { resolveEncodedName } from "../../../lib/encoded-names.js";
import { $, defineKit } from "../define-kit.js";
import { copyMap } from "../utils.js";
import { getPlausibleName } from "../utils/get-plausible-name.js";

/**  @experimental */
export interface TypeKit {
  /**
   * Clones a type and adds it to the typekit's realm.
   * @param type Type to clone
   */
  clone<T extends Type>(type: T): T;
  /**
   * Finishes a type, applying all the decorators.
   */
  finishType(type: Type): void;
  /**
   * Checks if a type is decorated with @error
   * @param type The type to check.
   */
  isError(type: Type): boolean;
  /**
   * Get the name of this type in the specified encoding.
   */
  getEncodedName(type: Type & { name: string }, encoding: string): string;

  /**
   * Get the summary of this type as specified by the `@summary` decorator.
   *
   * @param type The type to get the summary for.
   */
  getSummary(type: Type): string | undefined;

  /**
   * Get the documentation of this type as specified by the `@doc` decorator or
   * the JSDoc comment.
   *
   * @param type The type to get the documentation for.
   */
  getDoc(type: Type): string | undefined;
  /**
   * Get the plausible name of a type. If the type has a name, it will use it otherwise it will try generate a name based on the context.
   * If the type can't get a name, it will return an empty string.
   * If the type is a TemplateInstance, it will prefix the name with the template arguments.
   * @param type The scalar to get the name of.z
   */
  getPlausibleName(type: Model | Union | Enum | Scalar): string;
  /**
   * Resolves a discriminated union for the given model or union.
   * @param type Model or Union to resolve the discriminated union for.
   */
  getDiscriminatedUnion(type: Model | Union): Union | undefined;
  /**
   * Resolves the discriminator for a discriminated union. Returns undefined if the type is not a discriminated union.
   * @param type
   */
  getDiscriminator(type: Model | Union): Discriminator | undefined;
  /**
   * Gets the maximum value for a numeric or model property type.
   * @param type type to get the maximum value for
   */
  maxValue(type: Type): number | undefined;
  /**
   * Gets the minimum value for a numeric or model property type.
   * @param type type to get the minimum value for
   */
  minValue(type: Type): number | undefined;

  /**
   * Gets the maximum length for a string type.
   * @param type type to get the maximum length for
   */
  maxLength(type: Type): number | undefined;
  /**
   * Gets the minimum length for a string type.
   * @param type type to get the minimum length for
   */
  minLength(type: Type): number | undefined;
}

interface BaseTypeKit {
  /**
   * Utilities for working with general types.
   */
  type: TypeKit;
}

declare module "../define-kit.js" {
  interface TypekitPrototype extends BaseTypeKit {}
}

defineKit<BaseTypeKit>({
  type: {
    finishType(type: Type) {
      this.program.checker.finishType(type);
    },
    clone<T extends Type>(type: T): T {
      let clone: T;
      switch (type.kind) {
        case "Model":
          clone = this.program.checker.createType({
            ...type,
            decorators: [...type.decorators],
            properties: copyMap(type.properties),
            indexer: type.indexer ? { ...type.indexer } : undefined,
          });
          break;
        case "Union":
          clone = this.program.checker.createType({
            ...type,
            decorators: [...type.decorators],
            variants: copyMap(type.variants),
            get options() {
              return Array.from(this.variants.values()).map((v: any) => v.type);
            },
          });
          break;
        case "Interface":
          clone = this.program.checker.createType({
            ...type,
            decorators: [...type.decorators],
            operations: copyMap(type.operations),
          });
          break;

        case "Enum":
          clone = this.program.checker.createType({
            ...type,
            members: copyMap(type.members),
          });
          break;
        case "Namespace":
          clone = this.program.checker.createType({
            ...type,
            decorators: [...type.decorators],
            instantiationParameters: type.instantiationParameters
              ? [...type.instantiationParameters]
              : undefined,
            projections: [...type.projections],
          });
          const clonedNamespace = clone as Namespace;
          clonedNamespace.decoratorDeclarations = cloneTypeCollection(type.decoratorDeclarations, {
            namespace: clonedNamespace,
          });
          clonedNamespace.models = cloneTypeCollection(type.models, { namespace: clonedNamespace });
          clonedNamespace.enums = cloneTypeCollection(type.enums, { namespace: clonedNamespace });
          clonedNamespace.functionDeclarations = cloneTypeCollection(type.functionDeclarations, {
            namespace: clonedNamespace,
          });
          clonedNamespace.interfaces = cloneTypeCollection(type.interfaces, {
            namespace: clonedNamespace,
          });
          clonedNamespace.namespaces = cloneTypeCollection(type.namespaces, {
            namespace: clonedNamespace,
          });
          clonedNamespace.operations = cloneTypeCollection(type.operations, {
            namespace: clonedNamespace,
          });
          clonedNamespace.scalars = cloneTypeCollection(type.scalars, {
            namespace: clonedNamespace,
          });
          clonedNamespace.unions = cloneTypeCollection(type.unions, { namespace: clonedNamespace });
          break;
        default:
          clone = this.program.checker.createType({
            ...type,
            ...("decorators" in type ? { decorators: [...type.decorators] } : {}),
          });
          break;
      }
      this.realm.get().addType(clone);
      return clone;
    },
    isError(type) {
      return isErrorType(type);
    },
    getEncodedName(type, encoding) {
      return resolveEncodedName(this.program, type, encoding);
    },
    getSummary(type) {
      return getSummary(this.program, type);
    },
    getDoc(type) {
      return getDoc(this.program, type);
    },
    getPlausibleName(type) {
      return getPlausibleName(type);
    },
    getDiscriminator(type) {
      return getDiscriminator(this.program, type);
    },
    getDiscriminatedUnion(type) {
      const discriminator = getDiscriminator(this.program, type);

      if (!discriminator) {
        return undefined;
      }

      const [union] = getDiscriminatedUnion(type, discriminator);
      const variants = Array.from(union.variants.entries()).map(([k, v]) =>
        $.unionVariant.create({ name: k, type: v }),
      );
      return $.union.create({
        name: union.propertyName,
        variants,
      });
    },
    maxValue(type) {
      return getMaxValue(this.program, type);
    },
    minValue(type) {
      return getMinValue(this.program, type);
    },
    maxLength(type) {
      return getMaxLength(this.program, type);
    },
    minLength(type) {
      return getMinLength(this.program, type);
    },
  },
});

function cloneTypeCollection<T extends Type>(
  collection: Map<string, T>,
  options: { namespace?: Namespace } = {},
): Map<string, T> {
  const cloneCollection = new Map<string, T>();
  for (const [key, type] of collection) {
    const clone = $.type.clone(type);
    if ("namespace" in clone && options.namespace) {
      clone.namespace = options.namespace;
    }
    cloneCollection.set(key, clone);
  }
  return cloneCollection;
}
