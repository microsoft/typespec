---
changeKind: feature
packages:
  - "@typespec/compiler"
---

Added `auto` decorator modifier for declaring decorators that auto-store their arguments as metadata without requiring a JavaScript implementation.

```typespec
auto dec label(target: Model, value: valueof string);

@label("my-model")
model Foo {}
```

Added compiler API `hasAutoDecorator`, `getAutoDecoratorValue`, and `getAutoDecoratorTargets` for reading auto decorator values by FQN.
