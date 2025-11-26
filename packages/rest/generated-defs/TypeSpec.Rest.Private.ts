import type {
  DecoratorContext,
  DecoratorPostValidator,
  Model,
  ModelProperty,
  Operation,
  Scalar,
  Type,
} from "@typespec/compiler";

export type ResourceLocationDecorator = (
  context: DecoratorContext,
  target: Scalar,
  resourceType: Model,
) => DecoratorPostValidator | void;

export type ValidateHasKeyDecorator = (
  context: DecoratorContext,
  target: Type,
  value: Type,
) => DecoratorPostValidator | void;

export type ValidateIsErrorDecorator = (
  context: DecoratorContext,
  target: Type,
  value: Type,
) => DecoratorPostValidator | void;

export type ActionSegmentDecorator = (
  context: DecoratorContext,
  target: Operation,
  value: string,
) => DecoratorPostValidator | void;

export type ResourceTypeForKeyParamDecorator = (
  context: DecoratorContext,
  entity: ModelProperty,
  resourceType: Model,
) => DecoratorPostValidator | void;

export type TypeSpecRestPrivateDecorators = {
  resourceLocation: ResourceLocationDecorator;
  validateHasKey: ValidateHasKeyDecorator;
  validateIsError: ValidateIsErrorDecorator;
  actionSegment: ActionSegmentDecorator;
  resourceTypeForKeyParam: ResourceTypeForKeyParamDecorator;
};
