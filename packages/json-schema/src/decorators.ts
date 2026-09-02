import {
  type DecoratorContext,
  type Enum,
  isTemplateDeclaration,
  isType,
  type Model,
  type Namespace,
  type Numeric,
  type Program,
  type Scalar,
  serializeValueAsJson,
  setTypeSpecNamespace,
  type Tuple,
  type Type,
  typespecTypeToJson,
  type Union,
  type Value,
} from "@typespec/compiler";
import { useStateMap, useStateSet } from "@typespec/compiler/utils";
import type { ValidatesRawJsonDecorator } from "../generated-defs/TypeSpec.JsonSchema.Private.js";
import type {
  ExtensionDecorator,
  JsonSchemaDecorator,
} from "../generated-defs/TypeSpec.JsonSchema.js";
import {
  getBaseUri as getBaseUriOnNamespace,
  getContentEncoding as getContentEncodingOnScalar,
  getContentMediaType as getContentMediaTypeOnScalar,
  getContentSchema as getContentSchemaOnScalar,
  getMultipleOf as getMultipleOfOnScalar,
  getPrefixItems as getPrefixItemsAsType,
  isOneOf as isOneOfOnUnion,
  isUniqueItems,
  setBaseUri,
  setId,
} from "../generated-defs/TypeSpec.JsonSchema.js";
import { JsonSchemaStateKeys } from "./lib.js";

/**
 * TypeSpec Types that can create a json schmea declaration
 */
export type JsonSchemaDeclaration = Model | Union | Enum | Scalar;

export const [
  /** Check if the given type is annotated with `@jsonSchema`  */
  getJsonSchema,
  markJsonSchema,
] = useStateSet(JsonSchemaStateKeys.JsonSchema);
/** {@inheritdoc JsonSchemaDecorator} */
export const $jsonSchema: JsonSchemaDecorator = (
  context: DecoratorContext,
  target: Type,
  baseUriOrId?: string,
) => {
  markJsonSchema(context.program, target);
  if (baseUriOrId) {
    if (target.kind === "Namespace") {
      setBaseUri(context.program, target, baseUriOrId);
    } else {
      setId(context.program, target, baseUriOrId);
    }
  }
};

/**
 * Accessors for the metadata-only decorators are generated from their `auto dec`
 * declarations in `lib/main.tsp`. They are re-exported here when their generated
 * signature already matches the historical one, and wrapped below when the
 * historical signature was wider or returned a different shape.
 */
export {
  getContains,
  getId,
  getMaxContains,
  getMaxProperties,
  getMinContains,
  getMinProperties,
  setContains,
  setContentEncoding,
  setContentMediaType,
  setContentSchema,
  setId,
  setMaxContains,
  setMaxProperties,
  setMinContains,
  setMinProperties,
  setMultipleOf,
  setOneOf,
  setPrefixItems,
  setUniqueItems,
} from "../generated-defs/TypeSpec.JsonSchema.js";
export { setBaseUri };

/**
 * Get base uri set via `@baseUri` decorator.
 *
 * Accepts any type so that {@link findBaseUri} can probe a declaration before walking
 * up its enclosing namespaces; only namespaces can carry the decorator.
 */
export function getBaseUri(program: Program, target: Type): string | undefined {
  return getBaseUriOnNamespace(program, target as Namespace);
}

/** Find base uri for the given type. */
export function findBaseUri(
  program: Program,
  target: JsonSchemaDeclaration | Namespace,
): string | undefined {
  let baseUrl: string | undefined;
  let current: JsonSchemaDeclaration | Namespace | undefined = target;
  do {
    baseUrl = getBaseUri(program, current);
    current = current.namespace;
  } while (!baseUrl && current);

  return baseUrl;
}

/**
 * Check if the given type is annoted with `@jsonSchema` or within a container annoted with `@jsonSchema`.
 * @param program TypeSpec program
 * @param target Type
 */
export function isJsonSchemaDeclaration(program: Program, target: JsonSchemaDeclaration): boolean {
  let current: JsonSchemaDeclaration | Namespace | undefined = target;
  do {
    if (getJsonSchema(program, current)) {
      return true;
    }

    current = current.namespace;
  } while (current);

  return false;
}

type JsonSchemaDeclarationType = Model | Union | Enum | Scalar;
/**
 * Returns types that are annotated with `@jsonSchema` or contained within a namespace that is annoted with `@jsonSchema`.
 * @param program TypeSpec program
 */
export function getJsonSchemaTypes(program: Program): (JsonSchemaDeclarationType | Namespace)[] {
  const types: (JsonSchemaDeclarationType | Namespace)[] = [];

  function visitNamespace(ns: Namespace) {
    if (getJsonSchema(program, ns)) {
      types.push(ns);
    }

    visitMembers(ns.models.values());
    visitMembers(ns.enums.values());
    visitMembers(ns.unions.values());
    visitMembers(ns.scalars.values());
    for (const member of ns.namespaces.values()) {
      visitNamespace(member);
    }
  }

  function visitMembers(members: Iterable<JsonSchemaDeclarationType>) {
    for (const member of members) {
      visitDeclaration(member);
    }
  }

  function visitDeclaration(type: JsonSchemaDeclarationType) {
    if (
      !(type.kind !== "Enum" && isTemplateDeclaration(type)) &&
      isJsonSchemaDeclaration(program, type)
    ) {
      types.push(type);
    }
  }

  visitNamespace(program.getGlobalNamespaceType());

  return types;
}

/** Get value set by `@multipleOf` decorator as a `Numeric` type. */
export function getMultipleOfAsNumeric(program: Program, target: Type): Numeric | undefined {
  return getMultipleOfOnScalar(program, target as Scalar);
}

/** Get value set by `@multipleOf` decorator as a `number` type. If the value is not representable as a number or not set, returns undefined. */
export function getMultipleOf(program: Program, target: Type): number | undefined {
  return getMultipleOfAsNumeric(program, target)?.asNumber() ?? undefined;
}

/** Check if given type is annotated with `@oneOf` decorator */
export function isOneOf(program: Program, target: Type): boolean {
  return isOneOfOnUnion(program, target as Union);
}

/**
 * Check if the given array is annotated with `@uniqueItems` decorator.
 *
 * Returns `true` when the decorator is applied and `undefined` otherwise, so that callers
 * can distinguish "not set" from "set" when building constraint objects.
 */
export function getUniqueItems(program: Program, target: Type): true | undefined {
  return isUniqueItems(program, target) ? true : undefined;
}

/** Get content encoding as configured by `@contentEncoding` decorator. */
export function getContentEncoding(program: Program, target: Type): string | undefined {
  return getContentEncodingOnScalar(program, target as Scalar);
}

/** Get content media type as configured by `@contentMediaType` decorator. */
export function getContentMediaType(program: Program, target: Type): string | undefined {
  return getContentMediaTypeOnScalar(program, target as Scalar);
}

/** Get content schema set with `@contentSchema` decorator */
export function getContentSchema(program: Program, target: Type): Type | undefined {
  return getContentSchemaOnScalar(program, target as Scalar);
}

/** Get prefix items set with `@prefixItems` decorator */
export function getPrefixItems(program: Program, target: Type): Tuple | undefined {
  // This cast is incorrect and would cause a crash https://github.com/microsoft/typespec/issues/4742
  return getPrefixItemsAsType(program, target) as Tuple | undefined;
}

/**
 * Data type containing information about an extension.
 */
export interface ExtensionRecord {
  /** Extension key */
  key: string;
  /** Extension value */
  value: Type | unknown;
}

const [getExtensionsInternal, _, getExtensionsStateMap] = useStateMap<Type, ExtensionRecord[]>(
  JsonSchemaStateKeys["JsonSchema.extension"],
);
/** {@inheritdoc ExtensionDecorator} */
export const $extension: ExtensionDecorator = (
  context: DecoratorContext,
  target: Type,
  key: string,
  value: unknown,
) => {
  if (!isTypeLike(value)) {
    value = convertRemainingValuesToExtensions(context.program, value);
  }
  setExtension(context.program, target, key, value);
};

// Workaround until we have a way to disable arg marshalling and just call serializeValueAsJson
// https://github.com/microsoft/typespec/issues/3570
function convertRemainingValuesToExtensions(program: Program, value: unknown): unknown {
  switch (typeof value) {
    case "string":
    case "number":
    case "boolean":
      return value;
    case "object":
      if (value === null) {
        return null;
      }
      if (Array.isArray(value)) {
        return value.map((x) => convertRemainingValuesToExtensions(program, x));
      }

      if (isTypeSpecValue(value)) {
        return serializeValueAsJson(program, value, value.type);
      } else {
        const result: Record<string, unknown> = {};
        for (const [key, val] of Object.entries(value)) {
          if (val === undefined) {
            continue;
          }
          result[key] = convertRemainingValuesToExtensions(program, val);
        }
        return result;
      }
    default:
      return value;
  }
}

function isTypeLike(value: any): value is Type {
  return typeof value === "object" && value !== null && isType(value);
}

function isTypeSpecValue(value: object): value is Value {
  return "entityKind" in value && value.entityKind === "Value";
}

/**
 * Get extensions set via the `@extension` decorator on the given type
 * @param program TypeSpec program
 * @param target Type
 */
export function getExtensions(program: Program, target: Type): ExtensionRecord[] {
  return getExtensionsInternal(program, target) ?? [];
}
/**
 * Set extension on the given type(Same as calling `@extension` decorator)
 * @param program TypeSpec program
 * @param target Type
 * @param key Extension key
 * @param value Extension value
 */
export function setExtension(program: Program, target: Type, key: string, value: unknown) {
  const stateMap = getExtensionsStateMap(program);

  const extensions = stateMap.has(target)
    ? stateMap.get(target)!
    : stateMap.set(target, []).get(target)!;

  // Check if we were handed the `Json` template model
  if (isJsonTemplateType(value)) {
    extensions.push({
      key,
      value: typespecTypeToJson(value.properties.get("value")!.type, target)[0],
    });
  } else {
    extensions.push({ key, value });
  }
}

function isJsonTemplateType(
  value: any,
): value is Type & { kind: "Model"; name: "Json"; namespace: { name: "JsonSchema" } } {
  return (
    typeof value === "object" &&
    value !== null &&
    isType(value) &&
    value.kind === "Model" &&
    value.name === "Json" &&
    value.namespace?.name === "JsonSchema"
  );
}

/** @internal */
export const $validatesRawJson: ValidatesRawJsonDecorator = (
  context: DecoratorContext,
  target: Model,
  value: Type,
) => {
  const [_, diagnostics] = typespecTypeToJson(value, target);
  if (diagnostics.length > 0) {
    context.program.reportDiagnostics(diagnostics);
  }
};
setTypeSpecNamespace("Private", $validatesRawJson);
