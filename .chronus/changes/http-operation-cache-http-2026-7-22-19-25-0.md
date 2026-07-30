---
changeKind: feature
packages:
  - "@typespec/http"
---

Cache `getHttpOperation` results during linting and emitting stages using `program.useCache()`. This eliminates redundant route resolution when multiple linter rules inspect the same operations, improving linter performance on large specs.
