---
# Change versionKind to one of: internal, fix, dependencies, feature, deprecation, breaking
changeKind: breaking
packages:
  - "@typespec/http"
---

Make patch not apply optionality transform by default anymore. 

```diff lang=tsp
@patch op update(@body pet: Pet): void;
```

Replace with either the following to respect json merge patch:

```tsp
@patch op update(@body pet: MergePatchUpdate<Pet>): void;
```

or keep the old behavior

```tsp
@patch(#{ implicitOptional: true }) op update(@body pet: Pet): void;
```
