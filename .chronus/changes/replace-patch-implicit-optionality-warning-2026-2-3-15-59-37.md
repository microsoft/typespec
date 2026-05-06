---
# Change versionKind to one of: internal, fix, dependencies, feature, deprecation, breaking
changeKind: deprecation
packages:
  - "@typespec/http"
---

Deprecate use of `@patch(#{implicitOptionality: true})`.

Migrate using one of the following patterns depending on intended semantics:

1. Preserve previous behavior with an explicit patch model (optional properties)

```diff lang=typespec
  model Pet {
    name: string;
    age: int32;
  }

+ model PetPatch {
+    name?: string;
+    age?: int32;
+ }

  
- @patch(#{implicitOptionality: true}) op updatePet(@body patch: Pet): void;
+ @patch op updatePet(@body patch: PetPatch): void;
```

2. Use merge-patch semantics explicitly with `MergePatchUpdate<T>`

```typespec
model Pet {
  name: string;
  age: int32;
}

@patch op updatePet(@body patch: MergePatchUpdate<Pet>): void;
```

Use `MergePatchCreateOrUpdate<T>` when the operation supports create-or-update behavior.
