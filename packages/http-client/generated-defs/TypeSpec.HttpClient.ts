import type { DecoratorContext, DecoratorValidatorCallback, Type } from "@typespec/compiler";

export interface FeatureLifecycleOptions {
  readonly emitterScope?: string;
}

export type ExperimentalDecorator = (
  context: DecoratorContext,
  target: Type,
  options?: FeatureLifecycleOptions,
) => DecoratorValidatorCallback | void;

export type TypeSpecHttpClientDecorators = {
  experimental: ExperimentalDecorator;
};
