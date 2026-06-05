---
changeKind: feature
packages:
  - "@typespec/compiler"
---

Added support for accessing late-bound members on models that use template spreads or `is` bases.

Previously, accessing a member that was introduced via a template instantiation would fail with an `invalid-ref` error:

```typespec
model Template<T> {
  ...T;
}
model User is Template<{name: string}>;

alias UserName = User.name; // ❌ previously: "Model doesn't have member name"
```

Now, the compiler will force-evaluate the container type when a member lookup fails on a model with unknown members (from template spreads or `is`), making late-bound members accessible:

```typespec
model Template<T> {
  ...T;
}
model User is Template<{name: string}>;

alias UserName = User.name; // ✅ now resolves correctly
```

This also works with:
- Forward references to the template definition
- Spread-based patterns (`model A { ...Template<{x: int32}> }`)
- Members added by augment decorators
- Circular references between models with late-bound members
