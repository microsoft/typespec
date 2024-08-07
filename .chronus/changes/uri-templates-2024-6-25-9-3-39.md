---
changeKind: deprecation
packages:
  - "@typespec/http"
---

Deprecated `@query({format: })` option. Use `@query(#{explode: true})` instead of `form` or `multi` format. Previously `csv`/`simple` is the default now.
  Decorator is also expecting an object value now instead of a model. A deprecation warning with a codefix will help migrating.

  ```diff
  - @query({format: "form"}) select: string[];
  + @query(#{explode: true}) select: string[];
  ```
