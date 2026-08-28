import type { DecoratorContext, DecoratorValidatorCallbacks, Type } from "@typespec/compiler";

export interface FeatureLifecycleOptions {
  readonly emitterScope?: string;
  readonly diagnosticId?: string;
  readonly dependsOn?: readonly string[];
}

/**
 * Mark a type or member as experimental, so generated clients can surface it as such.
 *
 * @param options Options for this decorator, such as the emitters it applies to.
 */
export type ExperimentalDecorator = (
  context: DecoratorContext,
  target: Type,
  options?: FeatureLifecycleOptions,
) => DecoratorValidatorCallbacks | void;

export type TypeSpecHttpClientDecorators = {
  experimental: ExperimentalDecorator;
};
