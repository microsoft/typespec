import type { DecoratorContext, DecoratorPostValidator, Type } from "@typespec/compiler";

export interface FeatureLifecycleOptions {
  readonly emitterScope?: string;
}

export type ExperimentalDecorator = (
  context: DecoratorContext,
  target: Type,
  options?: FeatureLifecycleOptions,
) => DecoratorPostValidator | void;

export type TypeSpecHttpClientDecorators = {
  experimental: ExperimentalDecorator;
};
