import type {
  DecoratorContext,
  Interface,
  Model,
  ModelProperty,
  Namespace,
  Operation,
  Type,
  Union,
} from "@typespec/compiler";

/**
 * Specify that `oneOf` should be used instead of `anyOf` for that union.
 */
export type OneOfDecorator = (context: DecoratorContext, target: Union | ModelProperty) => void;

/**
 * Specify an external reference that should be used inside of emitting this type.
 *
 * @param ref External reference(e.g. "../../common.json#/components/schemas/Foo")
 */
export type UseRefDecorator = (
  context: DecoratorContext,
  target: Model | ModelProperty,
  ref: string,
) => void;

/**
 * Specify OpenAPI additional information.
 *
 * @param name tag name
 * @param additionalTag Additional information
 */
export type TagMetadataDecorator = (
  context: DecoratorContext,
  target: Namespace | Interface | Operation,
  name: string,
  additionalTag?: Type,
) => void;

export type TypeSpecOpenAPIDecorators = {
  oneOf: OneOfDecorator;
  useRef: UseRefDecorator;
  tagMetadata: TagMetadataDecorator;
};
