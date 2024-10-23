import type {
  DecoratorContext,
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
) => void;

export type ValidateHasKeyDecorator = (
  context: DecoratorContext,
  target: Type,
  value: Type,
) => void;

export type ValidateIsErrorDecorator = (
  context: DecoratorContext,
  target: Type,
  value: Type,
) => void;

export type ActionSegmentDecorator = (
  context: DecoratorContext,
  target: Operation,
  value: string,
) => void;

export type ResourceTypeForKeyParamDecorator = (
  context: DecoratorContext,
  entity: ModelProperty,
  resourceType: Model,
) => void;

export type TypeSpecRestPrivateDecorators = {
  resourceLocation: ResourceLocationDecorator;
  validateHasKey: ValidateHasKeyDecorator;
  validateIsError: ValidateIsErrorDecorator;
  actionSegment: ActionSegmentDecorator;
  resourceTypeForKeyParam: ResourceTypeForKeyParamDecorator;
};
