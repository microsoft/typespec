---
changeKind: fix
packages:
  - "@typespec/http"
---

Do not join routes starting with `?` or `:` with `/`(e.g. `@route("?pet=cat)` would result in `/?pet=cat`)
