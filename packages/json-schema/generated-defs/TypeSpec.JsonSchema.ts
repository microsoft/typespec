import {
  type DecoratorContext,
  type DecoratorValidatorCallbacks,
  getAutoDecoratorValue,
  hasAutoDecorator,
  type ModelProperty,
  type Namespace,
  type Numeric,
  type Program,
  type Scalar,
  setAutoDecorator,
  type Type,
  type Union,
} from "@typespec/compiler";

/**
 * Add to namespaces to emit models within that namespace to JSON schema.
 * Add to another declaration to emit that declaration to JSON schema.
 *
 * Optionally, for namespaces, you can provide a baseUri, and for other declarations,
 * you can provide the id.
 *
 * @param baseUri Schema IDs are interpreted as relative to this URI.
 */
export type JsonSchemaDecorator = (
  context: DecoratorContext,
  target: Type,
  baseUri?: string,
) => DecoratorValidatorCallbacks | void;

/**
 * Specify a custom property to add to the emitted schema. This is useful for adding custom keywords
 * and other vendor-specific extensions. Scalar values need to be specified using `typeof` to be converted to a schema.
 *
 * For example, `@extension("x-schema", typeof "foo")` will emit a JSON schema value for `x-schema`,
 * whereas `@extension("x-schema", "foo")` will emit the raw code `"foo"`.
 *
 * The value will be treated as a raw value if any of the following are true:
 * - The value is a scalar value (e.g. string, number, boolean, etc.)
 * - The value is wrapped in the `Json<Data>` template
 * - The value is provided using the value syntax (e.g. `#{}`, `#[]`)
 *
 * For example, `@extension("x-schema", { x: "value" })` will emit a JSON schema value for `x-schema`,
 * whereas `@extension("x-schema", #{x: "value"})` and `@extension("x-schema", Json<{x: "value"}>)`
 * will emit the raw JSON code `{x: "value"}`.
 *
 * @param key The name of the keyword of vendor extension, e.g. `x-custom`.
 * @param value The value of the keyword.
 */
export type ExtensionDecorator = (
  context: DecoratorContext,
  target: Type,
  key: string,
  value: Type | unknown,
) => DecoratorValidatorCallbacks | void;

export type TypeSpecJsonSchemaDecorators = {
  jsonSchema: JsonSchemaDecorator;
  extension: ExtensionDecorator;
};

/** Set the base URI for any schemas emitted from types within this namespace. */
export function getBaseUri(program: Program, target: Namespace): string | undefined {
  return getAutoDecoratorValue(program, "TypeSpec.JsonSchema.baseUri", target)?.["baseUri"] as any;
}

/** Set the base URI for any schemas emitted from types within this namespace. */
export function setBaseUri(program: Program, target: Namespace, baseUri: string): void {
  setAutoDecorator(program, "TypeSpec.JsonSchema.baseUri", target, { baseUri: baseUri });
}

/**
 * Specify the JSON Schema id. If this model or a parent namespace has a base URI,
 * the provided ID will be relative to that base URI.
 *
 * By default, the id will be constructed based on the declaration's name.
 */
export function getId(program: Program, target: Type): string | undefined {
  return getAutoDecoratorValue(program, "TypeSpec.JsonSchema.id", target)?.["id"] as any;
}

/**
 * Specify the JSON Schema id. If this model or a parent namespace has a base URI,
 * the provided ID will be relative to that base URI.
 *
 * By default, the id will be constructed based on the declaration's name.
 */
export function setId(program: Program, target: Type, id: string): void {
  setAutoDecorator(program, "TypeSpec.JsonSchema.id", target, { id: id });
}

/** Check if the `@TypeSpec.JsonSchema.oneOf` decorator was applied on the given target. */
export function isOneOf(program: Program, target: Union | ModelProperty): boolean {
  return hasAutoDecorator(program, "TypeSpec.JsonSchema.oneOf", target);
}

/** Specify that `oneOf` should be used instead of `anyOf` for that union. */
export function setOneOf(program: Program, target: Union | ModelProperty): void {
  setAutoDecorator(program, "TypeSpec.JsonSchema.oneOf", target);
}

/** Specify that the numeric type must be a multiple of some numeric value. */
export function getMultipleOf(
  program: Program,
  target: Scalar | ModelProperty,
): Numeric | undefined {
  return getAutoDecoratorValue(program, "TypeSpec.JsonSchema.multipleOf", target)?.["value"] as any;
}

/** Specify that the numeric type must be a multiple of some numeric value. */
export function setMultipleOf(
  program: Program,
  target: Scalar | ModelProperty,
  value: Numeric,
): void {
  setAutoDecorator(program, "TypeSpec.JsonSchema.multipleOf", target, { value: value });
}

/**
 * Specify that the array must contain at least one instance of the provided type.
 * Use `@minContains` and `@maxContains` to customize how many instances to expect.
 */
export function getContains(program: Program, target: Type | ModelProperty): Type | undefined {
  return getAutoDecoratorValue(program, "TypeSpec.JsonSchema.contains", target)?.["value"] as any;
}

/**
 * Specify that the array must contain at least one instance of the provided type.
 * Use `@minContains` and `@maxContains` to customize how many instances to expect.
 */
export function setContains(program: Program, target: Type | ModelProperty, value: Type): void {
  setAutoDecorator(program, "TypeSpec.JsonSchema.contains", target, { value: value });
}

/**
 * Used in conjunction with the `@contains` decorator,
 * specifies that the array must contain at least a certain number of the types provided by the `@contains` decorator.
 */
export function getMinContains(program: Program, target: Type | ModelProperty): number | undefined {
  return getAutoDecoratorValue(program, "TypeSpec.JsonSchema.minContains", target)?.[
    "value"
  ] as any;
}

/**
 * Used in conjunction with the `@contains` decorator,
 * specifies that the array must contain at least a certain number of the types provided by the `@contains` decorator.
 */
export function setMinContains(
  program: Program,
  target: Type | ModelProperty,
  value: number,
): void {
  setAutoDecorator(program, "TypeSpec.JsonSchema.minContains", target, { value: value });
}

/**
 * Used in conjunction with the `@contains` decorator,
 * specifies that the array must contain at most a certain number of the types provided by the `@contains` decorator.
 */
export function getMaxContains(program: Program, target: Type | ModelProperty): number | undefined {
  return getAutoDecoratorValue(program, "TypeSpec.JsonSchema.maxContains", target)?.[
    "value"
  ] as any;
}

/**
 * Used in conjunction with the `@contains` decorator,
 * specifies that the array must contain at most a certain number of the types provided by the `@contains` decorator.
 */
export function setMaxContains(
  program: Program,
  target: Type | ModelProperty,
  value: number,
): void {
  setAutoDecorator(program, "TypeSpec.JsonSchema.maxContains", target, { value: value });
}

/** Check if the `@TypeSpec.JsonSchema.uniqueItems` decorator was applied on the given target. */
export function isUniqueItems(program: Program, target: Type | ModelProperty): boolean {
  return hasAutoDecorator(program, "TypeSpec.JsonSchema.uniqueItems", target);
}

/** Specify that every item in the array must be unique. */
export function setUniqueItems(program: Program, target: Type | ModelProperty): void {
  setAutoDecorator(program, "TypeSpec.JsonSchema.uniqueItems", target);
}

/** Specify the minimum number of properties this object can have. */
export function getMinProperties(
  program: Program,
  target: Type | ModelProperty,
): number | undefined {
  return getAutoDecoratorValue(program, "TypeSpec.JsonSchema.minProperties", target)?.[
    "value"
  ] as any;
}

/** Specify the minimum number of properties this object can have. */
export function setMinProperties(
  program: Program,
  target: Type | ModelProperty,
  value: number,
): void {
  setAutoDecorator(program, "TypeSpec.JsonSchema.minProperties", target, { value: value });
}

/** Specify the maximum number of properties this object can have. */
export function getMaxProperties(
  program: Program,
  target: Type | ModelProperty,
): number | undefined {
  return getAutoDecoratorValue(program, "TypeSpec.JsonSchema.maxProperties", target)?.[
    "value"
  ] as any;
}

/** Specify the maximum number of properties this object can have. */
export function setMaxProperties(
  program: Program,
  target: Type | ModelProperty,
  value: number,
): void {
  setAutoDecorator(program, "TypeSpec.JsonSchema.maxProperties", target, { value: value });
}

/** Specify the encoding used for the contents of a string. */
export function getContentEncoding(
  program: Program,
  target: Scalar | ModelProperty,
): string | undefined {
  return getAutoDecoratorValue(program, "TypeSpec.JsonSchema.contentEncoding", target)?.[
    "value"
  ] as any;
}

/** Specify the encoding used for the contents of a string. */
export function setContentEncoding(
  program: Program,
  target: Scalar | ModelProperty,
  value: string,
): void {
  setAutoDecorator(program, "TypeSpec.JsonSchema.contentEncoding", target, { value: value });
}

/** Specify that the target array must begin with the provided types. */
export function getPrefixItems(program: Program, target: Type | ModelProperty): Type | undefined {
  return getAutoDecoratorValue(program, "TypeSpec.JsonSchema.prefixItems", target)?.[
    "value"
  ] as any;
}

/** Specify that the target array must begin with the provided types. */
export function setPrefixItems(program: Program, target: Type | ModelProperty, value: Type): void {
  setAutoDecorator(program, "TypeSpec.JsonSchema.prefixItems", target, { value: value });
}

/** Specify the content type of content stored in a string. */
export function getContentMediaType(
  program: Program,
  target: Scalar | ModelProperty,
): string | undefined {
  return getAutoDecoratorValue(program, "TypeSpec.JsonSchema.contentMediaType", target)?.[
    "value"
  ] as any;
}

/** Specify the content type of content stored in a string. */
export function setContentMediaType(
  program: Program,
  target: Scalar | ModelProperty,
  value: string,
): void {
  setAutoDecorator(program, "TypeSpec.JsonSchema.contentMediaType", target, { value: value });
}

/**
 * Specify the schema for the contents of a string when interpreted according to the content's
 * media type and encoding.
 */
export function getContentSchema(
  program: Program,
  target: Scalar | ModelProperty,
): Type | undefined {
  return getAutoDecoratorValue(program, "TypeSpec.JsonSchema.contentSchema", target)?.[
    "value"
  ] as any;
}

/**
 * Specify the schema for the contents of a string when interpreted according to the content's
 * media type and encoding.
 */
export function setContentSchema(
  program: Program,
  target: Scalar | ModelProperty,
  value: Type,
): void {
  setAutoDecorator(program, "TypeSpec.JsonSchema.contentSchema", target, { value: value });
}
