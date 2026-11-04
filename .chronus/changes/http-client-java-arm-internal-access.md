---
changeKind: feature
packages:
  - "@typespec/http-client-java"
---

Support `@access(Access.internal)` for ARM operations, models, and enums. Hide internal operations from public client and fluent APIs while retaining implementation methods, and generate internal-only types in `implementation.models`.

In an existing ARM service with a `Widget` resource and the standard ARM and client-generator imports and usings, mark an operation as internal for Java:

```typespec
@armResourceOperations
interface Widgets {
  @access(Access.internal, "java")
  inspect is ArmResourceActionSync<Widget, InternalRequest, InternalResult>;
}
```

The operation is excluded from public low-level client interfaces and fluent APIs, but its implementation methods remain generated for SDK customization. Its internal request and response models can be declared as follows:

```typespec
@access(Access.internal, "java")
model InternalRequest {
  name: string;
}

@access(Access.internal, "java")
model InternalResult {
  value: string;
}
```

These internal-only models are generated in `implementation.models`. Public usage takes precedence when a model is shared with a public API, so shared types remain publicly usable.
