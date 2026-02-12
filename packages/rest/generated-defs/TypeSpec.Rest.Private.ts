import type {
  DecoratorContext,
  DecoratorValidatorCallbacks,
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
) => DecoratorValidatorCallbacks | void;

export type ValidateHasKeyDecorator = (
  context: DecoratorContext,
  target: Type,
  value: Type,
) => DecoratorValidatorCallbacks | void;

export type ValidateIsErrorDecorator = (
  context: DecoratorContext,
  target: Type,
  value: Type,
) => DecoratorValidatorCallbacks | void;

export type ActionSegmentDecorator = (
  context: DecoratorContext,
  target: Operation,
  value: string,
) => DecoratorValidatorCallbacks | void;

export type ResourceTypeForKeyParamDecorator = (
  context: DecoratorContext,
  entity: ModelProperty,
  resourceType: Model,
) => DecoratorValidatorCallbacks | void;

export type TypeSpecRestPrivateDecorators = {
  resourceLocation: ResourceLocationDecorator;
  validateHasKey: ValidateHasKeyDecorator;
  validateIsError: ValidateIsErrorDecorator;
  actionSegment: ActionSegmentDecorator;
  resourceTypeForKeyParam: ResourceTypeForKeyParamDecorator;
};
