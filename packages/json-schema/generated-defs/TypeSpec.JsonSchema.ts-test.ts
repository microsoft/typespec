/** An error here would mean that the decorator is not exported or doesn't have the right name. */
import {
  $baseUri,
  $contains,
  $contentEncoding,
  $contentMediaType,
  $contentSchema,
  $extension,
  $id,
  $jsonSchema,
  $maxContains,
  $maxProperties,
  $minContains,
  $minProperties,
  $multipleOf,
  $oneOf,
  $prefixItems,
  $uniqueItems,
} from "@typespec/json-schema";
import type {
  BaseUriDecorator,
  ContainsDecorator,
  ContentEncodingDecorator,
  ContentMediaTypeDecorator,
  ContentSchemaDecorator,
  ExtensionDecorator,
  IdDecorator,
  JsonSchemaDecorator,
  MaxContainsDecorator,
  MaxPropertiesDecorator,
  MinContainsDecorator,
  MinPropertiesDecorator,
  MultipleOfDecorator,
  OneOfDecorator,
  PrefixItemsDecorator,
  UniqueItemsDecorator,
} from "./TypeSpec.JsonSchema.js";

type Decorators = {
  $jsonSchema: JsonSchemaDecorator;
  $baseUri: BaseUriDecorator;
  $id: IdDecorator;
  $oneOf: OneOfDecorator;
  $multipleOf: MultipleOfDecorator;
  $contains: ContainsDecorator;
  $minContains: MinContainsDecorator;
  $maxContains: MaxContainsDecorator;
  $uniqueItems: UniqueItemsDecorator;
  $minProperties: MinPropertiesDecorator;
  $maxProperties: MaxPropertiesDecorator;
  $contentEncoding: ContentEncodingDecorator;
  $prefixItems: PrefixItemsDecorator;
  $contentMediaType: ContentMediaTypeDecorator;
  $contentSchema: ContentSchemaDecorator;
  $extension: ExtensionDecorator;
};

/** An error here would mean that the exported decorator is not using the same signature. Make sure to have export const $decName: DecNameDecorator = (...) => ... */
const _: Decorators = {
  $jsonSchema,
  $baseUri,
  $id,
  $oneOf,
  $multipleOf,
  $contains,
  $minContains,
  $maxContains,
  $uniqueItems,
  $minProperties,
  $maxProperties,
  $contentEncoding,
  $prefixItems,
  $contentMediaType,
  $contentSchema,
  $extension,
};
