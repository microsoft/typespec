---
changeKind: fix
packages:
  - "@typespec/versioning"
---

Fix issue where the incompatible-versioned-reference diagnostic was incorrectly triggered when a model had a `@removed` decorator and one of its properties had an `@added` decorator, even if the versions were compatible.

Example:
```tsp
@removed(Versions.v3)
model Widget {
  @added(Versions.v2)
   name: string;
}
```
