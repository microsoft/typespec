import type {
  DecoratorContext,
  ModelProperty,
  Namespace,
  Numeric,
  Scalar,
  Type,
  Union,
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
  baseUri?: string
) => void;

/**
 * Set the base URI for any schemas emitted from types within this namespace.
 *
 * @param baseUri the base URI. Schema IDs inside this namespace are relative to this URI.
 */
export type BaseUriDecorator = (
  context: DecoratorContext,
  target: Namespace,
  baseUri: string
) => void;

/**
 * Specify the JSON Schema id. If this model or a parent namespace has a base URI,
 * the provided ID will be relative to that base URI.
 *
 * By default, the id will be constructed based on the declaration's name.
 *
 * @param id the id of the JSON schema for this declaration.
 */
export type IdDecorator = (context: DecoratorContext, target: Type, id: string) => void;

/**
 * Specify that `oneOf` should be used instead of `anyOf` for that union.
 */
export type OneOfDecorator = (context: DecoratorContext, target: Union | ModelProperty) => void;

/**
 * Specify that the numeric type must be a multiple of some numeric value.
 *
 * @param value The numeric type must be a multiple of this value.
 */
export type MultipleOfDecorator = (
  context: DecoratorContext,
  target: Scalar | ModelProperty,
  value: Numeric
) => void;

/**
 * Specify that the array must contain at least one instance of the provided type.
 * Use `@minContains` and `@maxContains` to customize how many instances to expect.
 *
 * @param value The type the array must contain.
 */
export type ContainsDecorator = (
  context: DecoratorContext,
  target: Type | ModelProperty,
  value: Type
) => void;

/**
 * Specify that the array must contain at least some number of the types provided
 * by the contains decorator.
 *
 * @param value The minimum number of instances the array must contain
 */
export type MinContainsDecorator = (
  context: DecoratorContext,
  target: Type | ModelProperty,
  value: number
) => void;

/**
 * Specify that the array must contain at most some number of the types provided
 * by the contains decorator.
 *
 * @param value The maximum number of instances the array must contain
 */
export type MaxContainsDecorator = (
  context: DecoratorContext,
  target: Type | ModelProperty,
  value: number
) => void;

/**
 * Specify that every item in the array must be unique.
 */
export type UniqueItemsDecorator = (
  context: DecoratorContext,
  target: Type | ModelProperty
) => void;

/**
 * Specify the minimum number of properties this object can have.
 *
 * @param value The minimum number of properties this object can have.
 */
export type MinPropertiesDecorator = (
  context: DecoratorContext,
  target: Type | ModelProperty,
  value: number
) => void;

/**
 * Specify the maximum number of properties this object can have.
 *
 * @param value The maximum number of properties this object can have.
 */
export type MaxPropertiesDecorator = (
  context: DecoratorContext,
  target: Type | ModelProperty,
  value: number
) => void;

/**
 * Specify the encoding used for the contents of a string.
 *
 * @param value
 *
 *
 */
export type ContentEncodingDecorator = (
  context: DecoratorContext,
  target: Scalar | ModelProperty,
  value: string
) => void;

/**
 * Specify that the target array must begin with the provided types.
 *
 * @param value a tuple containing the types that must be present at the start of the array
 */
export type PrefixItemsDecorator = (
  context: DecoratorContext,
  target: Type | ModelProperty,
  value: Type
) => void;

/**
 * Specify the content type of content stored in a string.
 *
 * @param value the media type of the string contents
 */
export type ContentMediaTypeDecorator = (
  context: DecoratorContext,
  target: Scalar | ModelProperty,
  value: string
) => void;

/**
 * Specify the schema for the contents of a string when interpreted according to the content's
 * media type and encoding.
 *
 * @param value the schema of the string contents
 */
export type ContentSchemaDecorator = (
  context: DecoratorContext,
  target: Scalar | ModelProperty,
  value: Type
) => void;

/**
 * Specify a custom property to add to the emitted schema. Useful for adding custom keywords
 * and other vendor-specific extensions. Scalar values need to be specified using `typeof` to be converted to a schema.
 *
 * For example, `@extension("x-schema", typeof "foo")` will emit a JSON schema value for `x-schema`,
 * whereas `@extension("x-schema", "foo")` will emit the raw code `"foo"`.
 *
 * The value will be treated as a raw value if any of the following are true:
 * 1. The value is a scalar value (e.g. string, number, boolean, etc.)
 * 2. The value is wrapped in the `Json<Data>` template
 * 3. The value is provided using the value syntax (e.g. `#{}`, `#[]`)
 *
 * For example, `@extension("x-schema", { x: "value" })` will emit a JSON schema value for `x-schema`,
 * whereas `@extension("x-schema", #{x: "value"})` and `@extension("x-schema", Json<{x: "value"}>)`
 * will emit the raw JSON code `{x: "value"}`.
 *
 * @param key the name of the keyword of vendor extension, e.g. `x-custom`.
 * @param value the value of the keyword.
 */
export type ExtensionDecorator = (
  context: DecoratorContext,
  target: Type,
  key: string,
  value: Type | unknown
) => void;
