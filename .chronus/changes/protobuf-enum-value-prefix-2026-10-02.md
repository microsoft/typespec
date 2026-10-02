---
changeKind: feature
packages:
  - "@typespec/protobuf"
---

Add an opt-in `enum-value-prefix: enum-name` emitter option to prefix enum values with the enum name in `UPPER_SNAKE_CASE`, without repeating the prefix in TypeSpec members.

```yaml
options:
  "@typespec/protobuf":
    enum-value-prefix: enum-name
```

For example, the `Shipped: 2` member of `OrderState` emits `ORDER_STATE_SHIPPED = 2`. Already-prefixed names are preserved, and collisions in the emitted package scope are reported as errors identifying the original conflicting symbol.

Existing output remains unchanged by default. Enum members and numeric values remain explicit; this option does not add an `Unspecified` member or infer numbers.
