---
changeKind: fix
packages:
  - "@typespec/http"
---

Fix `@statusCode` properties that take their range from `@minValue` and `@maxValue` on a scalar or its base scalar, which were reported as `status-code-invalid`.
