---
changeKind: fix
packages:
  - "@typespec/http"
---

In some scenarios, the options for the `@path` decorator do not accurately reflect the provided parameters, including the `#{allowReserved: true}` which is the `x-ms-skip-url-encoding` option. This change addresses and fixes this issue.
