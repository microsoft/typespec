---
changeKind: feature
packages:
  - "@typespec/openapi"
  - "@typespec/openapi3"
---

Add `identifier` field to the `License` model in `@typespec/openapi`. This is an SPDX license expression for the API (e.g. `"MIT"`, `"Apache-2.0"`). The `identifier` and `url` fields are mutually exclusive. For OpenAPI 3.1+, `identifier` is emitted as-is; for OpenAPI 3.0, it is emitted as the `x-oai-license-identifier` extension. Importing an OpenAPI document also supports reading back `identifier` (or `x-oai-license-identifier` for 3.0 documents).

```typespec
@info(#{
  license: #{ name: "MIT", identifier: "MIT" },
})
namespace MyService;
```
