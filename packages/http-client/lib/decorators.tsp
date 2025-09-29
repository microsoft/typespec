import "./common.tsp";
import "../dist/src/tsp-index.js";

namespace TypeSpec.HttpClient;

model FeatureLifecycleOptions {
  ...ClientDecoratorOptions;
}

extern dec experimental(target: unknown, options?: valueof FeatureLifecycleOptions);
