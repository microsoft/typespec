import type {
  DecoratorContext,
  DecoratorValidatorCallback,
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
) => DecoratorValidatorCallback | void;

export type ValidateHasKeyDecorator = (
  context: DecoratorContext,
  target: Type,
  value: Type,
) => DecoratorValidatorCallback | void;

export type ValidateIsErrorDecorator = (
  context: DecoratorContext,
  target: Type,
  value: Type,
) => DecoratorValidatorCallback | void;

export type ActionSegmentDecorator = (
  context: DecoratorContext,
  target: Operation,
  value: string,
) => DecoratorValidatorCallback | void;

export type ResourceTypeForKeyParamDecorator = (
  context: DecoratorContext,
  entity: ModelProperty,
  resourceType: Model,
) => DecoratorValidatorCallback | void;

export type TypeSpecRestPrivateDecorators = {
  resourceLocation: ResourceLocationDecorator;
  validateHasKey: ValidateHasKeyDecorator;
  validateIsError: ValidateIsErrorDecorator;
  actionSegment: ActionSegmentDecorator;
  resourceTypeForKeyParam: ResourceTypeForKeyParamDecorator;
};
