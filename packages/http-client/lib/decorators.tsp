import "./common.tsp";
import "../dist/src/tsp-index.js";

namespace TypeSpec.HttpClient;

/**
 * Options describing where a feature lifecycle decorator such as `@experimental` applies.
 */
model FeatureLifecycleOptions {
  ...ClientDecoratorOptions;
}

/**
 * Mark a type or member as experimental, so generated clients can surface it as such.
 *
 * @param options Options for this decorator, such as the emitters it applies to.
 */
extern dec experimental(target: unknown, options?: valueof FeatureLifecycleOptions);
