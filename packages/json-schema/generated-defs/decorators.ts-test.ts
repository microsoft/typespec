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
  $prefixItems,
  $uniqueItems,
  $validatesRawJson,
} from "@typespec/json-schema";
import {
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
  PrefixItemsDecorator,
  UniqueItemsDecorator,
  ValidatesRawJsonDecorator,
} from "./decorators.js";

type Decorators = {
  $validatesRawJson: ValidatesRawJsonDecorator;
  $jsonSchema: JsonSchemaDecorator;
  $baseUri: BaseUriDecorator;
  $id: IdDecorator;
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
  $validatesRawJson,
  $jsonSchema,
  $baseUri,
  $id,
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
