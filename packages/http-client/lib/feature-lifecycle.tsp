import "@typespec/compiler";
import "./common.tsp";

namespace TypeSpec.HttpClient;

enum FeatureLifecycle {
  Stable: "stable",
}

model FeatureLifecycleOptions {
  ...ClientDecoratorOptions;
}

extern dec featureLifecycle(
  target:
    | Reflection.Model
    | Reflection.ModelProperty
    | Reflection.Operation
    | Reflection.Interface
    | Reflection.Namespace
    | Reflection.Union
    | Reflection.UnionVariant
    | Reflection.Enum
    | Reflection.EnumMember
    | Reflection.Scalar,
  value: Reflection.EnumMember,
  options?: valueof FeatureLifecycleOptions
);
