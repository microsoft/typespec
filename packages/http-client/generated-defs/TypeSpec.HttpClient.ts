import type {
  DecoratorContext,
  Enum,
  EnumMember,
  Interface,
  Model,
  ModelProperty,
  Namespace,
  Operation,
  Scalar,
  Union,
  UnionVariant,
} from "@typespec/compiler";

export interface FeatureLifecycleOptions {
  readonly emitterScope?: string;
}

export type FeatureLifecycleDecorator = (
  context: DecoratorContext,
  target:
    | Model
    | ModelProperty
    | Operation
    | Interface
    | Namespace
    | Union
    | UnionVariant
    | Enum
    | EnumMember
    | Scalar,
  value: EnumMember,
  options?: FeatureLifecycleOptions,
) => void;

export type TypeSpecHttpClientDecorators = {
  featureLifecycle: FeatureLifecycleDecorator;
};
