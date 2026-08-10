---
changeKind: fix
packages:
  - "@typespec/openapi3"
---

[converter] Convert query parameters using `spaceDelimited`/`pipeDelimited` styles to `@encode(ArrayEncoding.spaceDelimited)`/`@encode(ArrayEncoding.pipeDelimited)` instead of dropping them, including when `explode: true` is set
