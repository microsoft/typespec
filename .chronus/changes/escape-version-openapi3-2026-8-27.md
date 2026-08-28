---
changeKind: fix
packages:
  - "@typespec/openapi3"
---

Sanitize the spec provided values interpolated in `output-file`(`{version}`, `{service-name}` and `{service-name-if-multiple}`) so a version or namespace name containing path separators cannot write the OpenAPI document outside of the emitter output dir.
