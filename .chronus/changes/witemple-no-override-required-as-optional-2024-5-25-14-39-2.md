---
changeKind: breaking
packages:
  - "@typespec/compiler"
---

Disallows overriding a required inherited property with an optional property.

In previous versions of TypeSpec, it was possible to override a required property with an optional property. This is no longer allowed. This change may result in errors in your code if you were relying on this bug, but specifications that used this behavior are likely to have been exposed to errors resulting from incoherent type checking behavior.

The following example demonstrates the behavior that is no longer allowed:

```tsp
model Base {
  example: string;
}

model Child extends Base {
  example?: string;
}
```

In this example, the `Child` model overrides the `example` property from the `Base` model with an optional property. This is no longer allowed.
