import { getLocationContext } from "../../core/helpers/location-context.js";
import {
  getMaxItems,
  getMaxLength,
  getMaxValue,
  getMaxValueExclusive,
  getMinItems,
  getMinLength,
  getMinValue,
  getMinValueExclusive,
} from "../../core/intrinsic-type-state.js";
import { isNeverType } from "../../core/type-utils.js";
import {
  Entity,
  Enum,
  Model,
  Namespace,
  Node,
  Scalar,
  Union,
  type Type,
} from "../../core/types.js";
import { getDoc, getSummary, isErrorModel } from "../../lib/decorators.js";
import { resolveEncodedName } from "../../lib/encoded-names.js";
import { createDiagnosable, Diagnosable } from "../create-diagnosable.js";
import { defineKit } from "../define-kit.js";
import { copyMap } from "../utils.js";
import { getPlausibleName } from "../utils/get-plausible-name.js";

/**
 * @typekit type
 */
export interface TypeTypekit {
  /**
   * Checks if `entity` is a Type.
   * @param entity The entity to check.
   */
  is(entity: Entity): entity is Type;
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
   * Checks if a type is decorated with `@error`
   * @param type The type to check.
   */
  isError(type: Type): type is Model;
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
   * Gets the maximum value this numeric type should be, exclusive of the given value.
   * @param type
   */
  maxValueExclusive(type: Type): number | undefined;

  /**
   * Gets the minimum value this numeric type should be, exclusive of the given value.
   * @param type type to get the minimum value for
   */
  minValueExclusive(type: Type): number | undefined;

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
  /**
   * Gets the maximum number of items for an array type.
   * @param type type to get the maximum number of items for
   */
  maxItems(type: Type): number | undefined;
  /**
   * Gets the minimum number of items for an array type.
   * @param type type to get the minimum number of items for
   */
  minItems(type: Type): number | undefined;
  /**
   * Checks if the given type is a never type.
   */
  isNever(type: Type): boolean;
  /**
   * Checks if the given type is a user defined type. Non-user defined types are defined in the compiler or other libraries imported by the spec.
   * @param type The type to check.
   * @returns True if the type is a user defined type, false otherwise.
   */
  isUserDefined(type: Type): boolean;

  /**
   * Checks if the given type is in the given namespace (directly or indirectly) by walking up the type's namespace chain.
   *
   * @param type The type to check.
   * @param namespace The namespace to check membership against.
   * @returns True if the type is in the namespace, false otherwise.
   */
  inNamespace(type: Type, namespace: Namespace): boolean;

  /**
   * Check if the source type can be assigned to the target.
   * @param source Source type
   * @param target Target type
   * @param diagnosticTarget Target for the diagnostic
   */
  isAssignableTo: Diagnosable<
    (source: Type, target: Entity, diagnosticTarget?: Entity | Node) => boolean
  >;

  /**
   * Resolve a type reference to a TypeSpec type.
   * By default any diagnostics are ignored.
   *
   * If a `kind` is provided, it will check if the resolved type matches the expected kind
   * and throw an error if it doesn't.
   *
   * Call `type.resolve.withDiagnostics("reference")` to get a tuple containing the resolved type and any diagnostics.
   */
  resolve: Diagnosable<
    <K extends Type["kind"] | undefined>(
      reference: string,
      kind?: K,
    ) => K extends Type["kind"] ? Extract<Type, { kind: K }> : undefined
  >;
}

interface TypekitExtension {
  /**
   * Utilities for working with general types.
   */
  type: TypeTypekit;
}

declare module "../define-kit.js" {
  interface Typekit extends TypekitExtension {}
}

defineKit<TypekitExtension>({
  type: {
    is(entity) {
      return entity.entityKind === "Type";
    },
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
            derivedModels: [...type.derivedModels],
            sourceModels: type.sourceModels.map((x) => ({ ...x })),
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
            decorators: [...type.decorators],
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
            models: copyMap(type.models as any),
            decoratorDeclarations: copyMap(type.decoratorDeclarations as any),
            enums: copyMap(type.enums as any),
            unions: copyMap(type.unions as any),
            operations: copyMap(type.operations as any),
            interfaces: copyMap(type.interfaces as any),
            namespaces: copyMap(type.namespaces as any),
            scalars: copyMap(type.scalars as any),
          });
          break;
        case "Scalar":
          clone = this.program.checker.createType({
            ...type,
            decorators: [...type.decorators],
            derivedScalars: [...type.derivedScalars],
            constructors: copyMap(type.constructors as any),
          });
          break;
        case "Tuple":
          clone = this.program.checker.createType({
            ...type,
            values: [...type.values],
          });
          break;
        default:
          clone = this.program.checker.createType({
            ...type,
            ...("decorators" in type ? { decorators: [...type.decorators] } : {}),
          });
          break;
      }
      this.realm.addType(clone);
      return clone;
    },
    isError(type) {
      return isErrorModel(this.program, type);
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
    maxItems(type) {
      return getMaxItems(this.program, type);
    },
    maxValueExclusive(type) {
      return getMaxValueExclusive(this.program, type);
    },
    minValueExclusive(type) {
      return getMinValueExclusive(this.program, type);
    },
    minItems(type) {
      return getMinItems(this.program, type);
    },
    isNever(type) {
      return isNeverType(type);
    },
    isUserDefined(type) {
      return getLocationContext(this.program, type).type === "project";
    },
    inNamespace(type: Type, namespace: Namespace): boolean {
      // A namespace is always in itself
      if (type === namespace) {
        return true;
      }

      // Handle types with known containers
      switch (type.kind) {
        case "ModelProperty":
          if (type.model) {
            return this.type.inNamespace(type.model, namespace);
          }
          break;
        case "EnumMember":
          return this.type.inNamespace(type.enum, namespace);
        case "UnionVariant":
          return this.type.inNamespace(type.union, namespace);
        case "Operation":
          if (type.interface) {
            return this.type.inNamespace(type.interface, namespace);
          }
          // Operations that belong to a namespace directly will be handled in the generic case
          break;
      }

      // Generic case handles all other types
      if ("namespace" in type && type.namespace) {
        return this.type.inNamespace(type.namespace, namespace);
      }
      // If we got this far, the type does not belong to the namespace
      return false;
    },
    isAssignableTo: createDiagnosable(function (source, target, diagnosticTarget) {
      return this.program.checker.isTypeAssignableTo(source, target, diagnosticTarget ?? source);
    }),
    resolve: createDiagnosable(function (reference, kind) {
      const [type, diagnostics] = this.program.resolveTypeReference(reference);
      if (type && kind && type.kind !== kind) {
        throw new Error(`Type kind mismatch: expected ${kind}, got ${type.kind}`);
      }
      return [type, diagnostics];
    }),
  },
});
