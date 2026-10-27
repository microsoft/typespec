import type { DecoratorContext, DecoratorValidatorCallbacks, Type } from "@typespec/compiler";

/**
 * Options describing where a feature lifecycle decorator such as `@experimental` applies.
 */
export interface FeatureLifecycleOptions {
  /**
   * Comma separated list of emitter names the decorator applies to.
   */
  readonly emitterScope?: string;
  /**
   * The diagnostic identifier surfaced by emitters for this experimental API.
   */
  readonly diagnosticId?: string;
  /**
   * Warning text surfaced by emitters for this experimental API.
   */
  readonly warningText?: string;
  /**
   * Diagnostic identifiers for experimental features this API depends on. These dependencies do
   * not automatically remove this API's experimental status when they become generally available.
   */
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
