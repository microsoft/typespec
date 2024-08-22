---
# Change versionKind to one of: internal, fix, dependencies, feature, deprecation, breaking
changeKind: feature
packages:
  - "@typespec/compiler"
---

Add new way to define decorator implementation with `$decorators` export.
```ts
export const $decorators = {
  "TypeSpec.OpenAPI": {
    useRef: $useRef,
    oneOf: $oneOf,
  },
};
```
