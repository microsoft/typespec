---
changeKind: breaking
packages:
  - "@typespec/openapi3"
---

Using `{service-name}` in `tspconfig.yaml` will always interpolate the current service name. `{service-name-if-multiple}` can be used to get the previous behavior