import type {
  DecoratorContext,
  DecoratorPostValidator,
  Model,
  ModelProperty,
  Union,
} from "@typespec/compiler";

/**
 * Specify that `oneOf` should be used instead of `anyOf` for that union.
 */
export type OneOfDecorator = (
  context: DecoratorContext,
  target: Union | ModelProperty,
) => DecoratorPostValidator | void;

/**
 * Specify an external reference that should be used inside of emitting this type.
 *
 * @param ref External reference(e.g. "../../common.json#/components/schemas/Foo")
 */
export type UseRefDecorator = (
  context: DecoratorContext,
  target: Model | ModelProperty,
  ref: string,
) => DecoratorPostValidator | void;

export type TypeSpecOpenAPIDecorators = {
  oneOf: OneOfDecorator;
  useRef: UseRefDecorator;
};
