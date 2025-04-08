---
changeKind: fix
packages:
  - "@typespec/http-server-js"
---

Corrected router parameter generation so that it avoids using JavaScript reserved keywords for route controller parameters.

Corrected models that extend `Record` so that they refer to TypeScript's `Record` type by name instead of using a literal interface with an indexer.
