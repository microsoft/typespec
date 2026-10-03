import type { DecoratorContext, DecoratorValidatorCallbacks, Program } from "@typespec/compiler";
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
 * JavaScript implementation. The `$name` functions and `NameDecorator` types below are kept so that
 * existing code importing them keeps compiling, but they are no longer what the compiler invokes.
 * Use the corresponding `setName` accessor instead.
 */

/** Any of the `set*` accessors generated for an auto decorator. */
type Setter = (program: Program, target: any, ...args: any[]) => void;

/** The decorator signature matching the given `set*` accessor. */
type DecoratorOf<T extends Setter> = T extends (
  program: Program,
  target: infer Target,
  ...args: infer Args
) => void
  ? (context: DecoratorContext, target: Target, ...args: Args) => DecoratorValidatorCallbacks | void
  : never;

function decoratorOf<T extends Setter>(set: T): DecoratorOf<T> {
  return ((context: DecoratorContext, target: any, ...args: any[]) =>
    set(context.program, target, ...args)) as DecoratorOf<T>;
}

/* eslint-disable @typescript-eslint/no-deprecated */

/** Signature of the `@baseUri` decorator. @deprecated Use `setBaseUri` instead. */
export type BaseUriDecorator = DecoratorOf<typeof setBaseUri>;
/** Signature of the `@id` decorator. @deprecated Use `setId` instead. */
export type IdDecorator = DecoratorOf<typeof setId>;
/** Signature of the `@oneOf` decorator. @deprecated Use `setOneOf` instead. */
export type OneOfDecorator = DecoratorOf<typeof setOneOf>;
/** Signature of the `@multipleOf` decorator. @deprecated Use `setMultipleOf` instead. */
export type MultipleOfDecorator = DecoratorOf<typeof setMultipleOf>;
/** Signature of the `@contains` decorator. @deprecated Use `setContains` instead. */
export type ContainsDecorator = DecoratorOf<typeof setContains>;
/** Signature of the `@minContains` decorator. @deprecated Use `setMinContains` instead. */
export type MinContainsDecorator = DecoratorOf<typeof setMinContains>;
/** Signature of the `@maxContains` decorator. @deprecated Use `setMaxContains` instead. */
export type MaxContainsDecorator = DecoratorOf<typeof setMaxContains>;
/** Signature of the `@uniqueItems` decorator. @deprecated Use `setUniqueItems` instead. */
export type UniqueItemsDecorator = DecoratorOf<typeof setUniqueItems>;
/** Signature of the `@minProperties` decorator. @deprecated Use `setMinProperties` instead. */
export type MinPropertiesDecorator = DecoratorOf<typeof setMinProperties>;
/** Signature of the `@maxProperties` decorator. @deprecated Use `setMaxProperties` instead. */
export type MaxPropertiesDecorator = DecoratorOf<typeof setMaxProperties>;
/** Signature of the `@contentEncoding` decorator. @deprecated Use `setContentEncoding` instead. */
export type ContentEncodingDecorator = DecoratorOf<typeof setContentEncoding>;
/** Signature of the `@contentMediaType` decorator. @deprecated Use `setContentMediaType` instead. */
export type ContentMediaTypeDecorator = DecoratorOf<typeof setContentMediaType>;
/** Signature of the `@contentSchema` decorator. @deprecated Use `setContentSchema` instead. */
export type ContentSchemaDecorator = DecoratorOf<typeof setContentSchema>;
/** Signature of the `@prefixItems` decorator. @deprecated Use `setPrefixItems` instead. */
export type PrefixItemsDecorator = DecoratorOf<typeof setPrefixItems>;

/** Implementation of the `@baseUri` decorator. @deprecated Use `setBaseUri` instead. */
export const $baseUri: BaseUriDecorator = decoratorOf(setBaseUri);
/** Implementation of the `@id` decorator. @deprecated Use `setId` instead. */
export const $id: IdDecorator = decoratorOf(setId);
/** Implementation of the `@oneOf` decorator. @deprecated Use `setOneOf` instead. */
export const $oneOf: OneOfDecorator = decoratorOf(setOneOf);
/** Implementation of the `@multipleOf` decorator. @deprecated Use `setMultipleOf` instead. */
export const $multipleOf: MultipleOfDecorator = decoratorOf(setMultipleOf);
/** Implementation of the `@contains` decorator. @deprecated Use `setContains` instead. */
export const $contains: ContainsDecorator = decoratorOf(setContains);
/** Implementation of the `@minContains` decorator. @deprecated Use `setMinContains` instead. */
export const $minContains: MinContainsDecorator = decoratorOf(setMinContains);
/** Implementation of the `@maxContains` decorator. @deprecated Use `setMaxContains` instead. */
export const $maxContains: MaxContainsDecorator = decoratorOf(setMaxContains);
/** Implementation of the `@uniqueItems` decorator. @deprecated Use `setUniqueItems` instead. */
export const $uniqueItems: UniqueItemsDecorator = decoratorOf(setUniqueItems);
/** Implementation of the `@minProperties` decorator. @deprecated Use `setMinProperties` instead. */
export const $minProperties: MinPropertiesDecorator = decoratorOf(setMinProperties);
/** Implementation of the `@maxProperties` decorator. @deprecated Use `setMaxProperties` instead. */
export const $maxProperties: MaxPropertiesDecorator = decoratorOf(setMaxProperties);
/** Implementation of the `@contentEncoding` decorator. @deprecated Use `setContentEncoding` instead. */
export const $contentEncoding: ContentEncodingDecorator = decoratorOf(setContentEncoding);
/** Implementation of the `@contentMediaType` decorator. @deprecated Use `setContentMediaType` instead. */
export const $contentMediaType: ContentMediaTypeDecorator = decoratorOf(setContentMediaType);
/** Implementation of the `@contentSchema` decorator. @deprecated Use `setContentSchema` instead. */
export const $contentSchema: ContentSchemaDecorator = decoratorOf(setContentSchema);
/** Implementation of the `@prefixItems` decorator. @deprecated Use `setPrefixItems` instead. */
export const $prefixItems: PrefixItemsDecorator = decoratorOf(setPrefixItems);
