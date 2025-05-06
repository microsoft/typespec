---
# Change versionKind to one of: internal, fix, dependencies, feature, deprecation, breaking
changeKind: breaking
packages:
  - "@typespec/http"
---

Changed `@patch` so that it does not apply the "implicit optionality" transform by default anymore.

```diff lang=tsp
@patch op update(@body pet: Pet): void;
```

To use JSON Merge-Patch to update resources, replace the body property with an instance of `MergePatchUpdate` as follows:

```tsp
@patch op update(@body pet: MergePatchUpdate<Pet>): void;
```

Or, keep the old behavior by explicitly enabling `implicitOptionality` in the `@patch` options:

```tsp
@patch(#{ implicitOptionality: true }) op update(@body pet: Pet): void;
```
