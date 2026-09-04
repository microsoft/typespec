import type {
  DecoratorContext,
  DecoratorValidatorCallbacks,
  ModelProperty,
  Namespace,
  Numeric,
  Scalar,
  Type,
  Union,
} from "@typespec/compiler";
import {
  setBaseUri,
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

/**
 * The metadata-only decorators of this library are declared as `auto dec` and no longer have a
 * JavaScript implementation. The `$name` functions and `NameDecorator` types below are kept so
 * that existing code importing them keeps compiling, but they are no longer the implementation
 * the compiler invokes. Use the corresponding `setName` accessor instead.
 */

/* eslint-disable @typescript-eslint/no-deprecated */

/**
 * Signature of the `@baseUri` decorator.
 * @deprecated `@baseUri` is now an `auto dec` and has no JavaScript implementation. Use `setBaseUri` instead.
 */
export type BaseUriDecorator = (
  context: DecoratorContext,
  target: Namespace,
  baseUri: string,
) => DecoratorValidatorCallbacks | void;

/**
 * Signature of the `@id` decorator.
 * @deprecated `@id` is now an `auto dec` and has no JavaScript implementation. Use `setId` instead.
 */
export type IdDecorator = (
  context: DecoratorContext,
  target: Type,
  id: string,
) => DecoratorValidatorCallbacks | void;

/**
 * Signature of the `@oneOf` decorator.
 * @deprecated `@oneOf` is now an `auto dec` and has no JavaScript implementation. Use `setOneOf` instead.
 */
export type OneOfDecorator = (
  context: DecoratorContext,
  target: Union | ModelProperty,
) => DecoratorValidatorCallbacks | void;

/**
 * Signature of the `@multipleOf` decorator.
 * @deprecated `@multipleOf` is now an `auto dec` and has no JavaScript implementation. Use `setMultipleOf` instead.
 */
export type MultipleOfDecorator = (
  context: DecoratorContext,
  target: Scalar | ModelProperty,
  value: Numeric,
) => DecoratorValidatorCallbacks | void;

/**
 * Signature of the `@contains` decorator.
 * @deprecated `@contains` is now an `auto dec` and has no JavaScript implementation. Use `setContains` instead.
 */
export type ContainsDecorator = (
  context: DecoratorContext,
  target: Type | ModelProperty,
  value: Type,
) => DecoratorValidatorCallbacks | void;

/**
 * Signature of the `@minContains` decorator.
 * @deprecated `@minContains` is now an `auto dec` and has no JavaScript implementation. Use `setMinContains` instead.
 */
export type MinContainsDecorator = (
  context: DecoratorContext,
  target: Type | ModelProperty,
  value: number,
) => DecoratorValidatorCallbacks | void;

/**
 * Signature of the `@maxContains` decorator.
 * @deprecated `@maxContains` is now an `auto dec` and has no JavaScript implementation. Use `setMaxContains` instead.
 */
export type MaxContainsDecorator = (
  context: DecoratorContext,
  target: Type | ModelProperty,
  value: number,
) => DecoratorValidatorCallbacks | void;

/**
 * Signature of the `@uniqueItems` decorator.
 * @deprecated `@uniqueItems` is now an `auto dec` and has no JavaScript implementation. Use `setUniqueItems` instead.
 */
export type UniqueItemsDecorator = (
  context: DecoratorContext,
  target: Type | ModelProperty,
) => DecoratorValidatorCallbacks | void;

/**
 * Signature of the `@minProperties` decorator.
 * @deprecated `@minProperties` is now an `auto dec` and has no JavaScript implementation. Use `setMinProperties` instead.
 */
export type MinPropertiesDecorator = (
  context: DecoratorContext,
  target: Type | ModelProperty,
  value: number,
) => DecoratorValidatorCallbacks | void;

/**
 * Signature of the `@maxProperties` decorator.
 * @deprecated `@maxProperties` is now an `auto dec` and has no JavaScript implementation. Use `setMaxProperties` instead.
 */
export type MaxPropertiesDecorator = (
  context: DecoratorContext,
  target: Type | ModelProperty,
  value: number,
) => DecoratorValidatorCallbacks | void;

/**
 * Signature of the `@contentEncoding` decorator.
 * @deprecated `@contentEncoding` is now an `auto dec` and has no JavaScript implementation. Use `setContentEncoding` instead.
 */
export type ContentEncodingDecorator = (
  context: DecoratorContext,
  target: Scalar | ModelProperty,
  value: string,
) => DecoratorValidatorCallbacks | void;

/**
 * Signature of the `@prefixItems` decorator.
 * @deprecated `@prefixItems` is now an `auto dec` and has no JavaScript implementation. Use `setPrefixItems` instead.
 */
export type PrefixItemsDecorator = (
  context: DecoratorContext,
  target: Type | ModelProperty,
  value: Type,
) => DecoratorValidatorCallbacks | void;

/**
 * Signature of the `@contentMediaType` decorator.
 * @deprecated `@contentMediaType` is now an `auto dec` and has no JavaScript implementation. Use `setContentMediaType` instead.
 */
export type ContentMediaTypeDecorator = (
  context: DecoratorContext,
  target: Scalar | ModelProperty,
  value: string,
) => DecoratorValidatorCallbacks | void;

/**
 * Signature of the `@contentSchema` decorator.
 * @deprecated `@contentSchema` is now an `auto dec` and has no JavaScript implementation. Use `setContentSchema` instead.
 */
export type ContentSchemaDecorator = (
  context: DecoratorContext,
  target: Scalar | ModelProperty,
  value: Type,
) => DecoratorValidatorCallbacks | void;

/**
 * Implementation of the `@baseUri` decorator.
 * @deprecated `@baseUri` is now an `auto dec` and has no JavaScript implementation. Use `setBaseUri` instead.
 */
export const $baseUri: BaseUriDecorator = (context, target, baseUri) => {
  setBaseUri(context.program, target, baseUri);
};

/**
 * Implementation of the `@id` decorator.
 * @deprecated `@id` is now an `auto dec` and has no JavaScript implementation. Use `setId` instead.
 */
export const $id: IdDecorator = (context, target, id) => {
  setId(context.program, target, id);
};

/**
 * Implementation of the `@oneOf` decorator.
 * @deprecated `@oneOf` is now an `auto dec` and has no JavaScript implementation. Use `setOneOf` instead.
 */
export const $oneOf: OneOfDecorator = (context, target) => {
  setOneOf(context.program, target);
};

/**
 * Implementation of the `@multipleOf` decorator.
 * @deprecated `@multipleOf` is now an `auto dec` and has no JavaScript implementation. Use `setMultipleOf` instead.
 */
export const $multipleOf: MultipleOfDecorator = (context, target, value) => {
  setMultipleOf(context.program, target, value);
};

/**
 * Implementation of the `@contains` decorator.
 * @deprecated `@contains` is now an `auto dec` and has no JavaScript implementation. Use `setContains` instead.
 */
export const $contains: ContainsDecorator = (context, target, value) => {
  setContains(context.program, target, value);
};

/**
 * Implementation of the `@minContains` decorator.
 * @deprecated `@minContains` is now an `auto dec` and has no JavaScript implementation. Use `setMinContains` instead.
 */
export const $minContains: MinContainsDecorator = (context, target, value) => {
  setMinContains(context.program, target, value);
};

/**
 * Implementation of the `@maxContains` decorator.
 * @deprecated `@maxContains` is now an `auto dec` and has no JavaScript implementation. Use `setMaxContains` instead.
 */
export const $maxContains: MaxContainsDecorator = (context, target, value) => {
  setMaxContains(context.program, target, value);
};

/**
 * Implementation of the `@uniqueItems` decorator.
 * @deprecated `@uniqueItems` is now an `auto dec` and has no JavaScript implementation. Use `setUniqueItems` instead.
 */
export const $uniqueItems: UniqueItemsDecorator = (context, target) => {
  setUniqueItems(context.program, target);
};

/**
 * Implementation of the `@minProperties` decorator.
 * @deprecated `@minProperties` is now an `auto dec` and has no JavaScript implementation. Use `setMinProperties` instead.
 */
export const $minProperties: MinPropertiesDecorator = (context, target, value) => {
  setMinProperties(context.program, target, value);
};

/**
 * Implementation of the `@maxProperties` decorator.
 * @deprecated `@maxProperties` is now an `auto dec` and has no JavaScript implementation. Use `setMaxProperties` instead.
 */
export const $maxProperties: MaxPropertiesDecorator = (context, target, value) => {
  setMaxProperties(context.program, target, value);
};

/**
 * Implementation of the `@contentEncoding` decorator.
 * @deprecated `@contentEncoding` is now an `auto dec` and has no JavaScript implementation. Use `setContentEncoding` instead.
 */
export const $contentEncoding: ContentEncodingDecorator = (context, target, value) => {
  setContentEncoding(context.program, target, value);
};

/**
 * Implementation of the `@prefixItems` decorator.
 * @deprecated `@prefixItems` is now an `auto dec` and has no JavaScript implementation. Use `setPrefixItems` instead.
 */
export const $prefixItems: PrefixItemsDecorator = (context, target, value) => {
  setPrefixItems(context.program, target, value);
};

/**
 * Implementation of the `@contentMediaType` decorator.
 * @deprecated `@contentMediaType` is now an `auto dec` and has no JavaScript implementation. Use `setContentMediaType` instead.
 */
export const $contentMediaType: ContentMediaTypeDecorator = (context, target, value) => {
  setContentMediaType(context.program, target, value);
};

/**
 * Implementation of the `@contentSchema` decorator.
 * @deprecated `@contentSchema` is now an `auto dec` and has no JavaScript implementation. Use `setContentSchema` instead.
 */
export const $contentSchema: ContentSchemaDecorator = (context, target, value) => {
  setContentSchema(context.program, target, value);
};
