---
changeKind: internal
packages:
  - "@typespec/openapi3"
---

Remove the unused version generation script and `version.ts` from `@typespec/openapi3`. The exported `packageVersion` was not referenced anywhere, so the `gen-version` build step and its generated `version.js` output have been removed.
