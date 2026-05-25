---
changeKind: feature
packages:
  - "@typespec/openapi"
  - "@typespec/openapi3"
---

Add array form for `@tagMetadata` decorator to allow explicit control of tag declaration order.

```typespec
@service()
@tagMetadata(#[
  #{ name: "First Tag", description: "First tag description" },
  #{ name: "Second Tag", description: "Second tag description" },
])
namespace PetStore {}
```

Using `@tagMetadata(#[...])` and `@tagMetadata("name", #{...})` on the same namespace is a diagnostic error.
