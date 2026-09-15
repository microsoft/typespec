---
changeKind: fix
packages:
  - "@typespec/versioning"
---

Keep OptionalProperties properties optional in every version, including spreads and properties already made optional. Honor explicit structural overrides instead of inherited @madeRequired and @madeOptional history, while preserving presence, rename, and type history and validating newly authored annotations.