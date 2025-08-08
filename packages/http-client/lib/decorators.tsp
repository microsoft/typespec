import "./common.tsp";
import "../dist/src/tsp-index.js";

namespace TypeSpec.HttpClient;

enum FeatureLifecycle {
  Experimental,
}

model FeatureLifecycleOptions {
  ...ClientDecoratorOptions;
}

extern dec featureLifecycle(
  target: unknown,
  value: Reflection.EnumMember,
  options?: valueof FeatureLifecycleOptions
);
