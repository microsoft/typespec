import type { DecoratorContext, EnumMember, Type } from "@typespec/compiler";

export interface FeatureLifecycleOptions {
  readonly emitterScope?: string;
}

export type FeatureLifecycleDecorator = (
  context: DecoratorContext,
  target: Type,
  value: EnumMember,
  options?: FeatureLifecycleOptions,
) => void;

export type TypeSpecHttpClientDecorators = {
  featureLifecycle: FeatureLifecycleDecorator;
};
