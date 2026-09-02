---
changeKind: feature
packages:
  - "@typespec/http"
---

Added linting rule `no-content-type-optionality-mismatch` that validates the optionality of a Content-Type header matches the optionality of the associated request body.
