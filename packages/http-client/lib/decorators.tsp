import "./common.tsp";
import "../dist/src/tsp-index.js";

namespace TypeSpec.HttpClient;

/**
 * Options describing where a feature lifecycle decorator such as `@experimental` applies.
 */
model FeatureLifecycleOptions {
  ...ClientDecoratorOptions;

  /**
   * The diagnostic identifier surfaced by emitters for this experimental API.
   */
  diagnosticId?: string;

  /**
   * Diagnostic identifiers for experimental features this API depends on. These dependencies do
   * not automatically remove this API's experimental status when they become generally available.
   */
  dependsOn?: string[];
}

/**
 * Mark a type or member as experimental, so generated clients can surface it as such.
 *
 * @param options Options for this decorator, such as the emitters it applies to.
 */
extern dec experimental(target: unknown, options?: valueof FeatureLifecycleOptions);
