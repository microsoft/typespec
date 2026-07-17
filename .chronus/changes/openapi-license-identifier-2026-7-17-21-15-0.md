---
changeKind: feature
packages:
  - "@typespec/openapi"
---

Add support for the OpenAPI `info.license.identifier` field (an SPDX license expression) on the `License` model used with `@info`. The `identifier` and `url` fields are mutually exclusive; specifying both now results in a diagnostic.

```tsp
@info(#{
  license: #{
    name: "Apache 2.0",
    identifier: "Apache-2.0",
  },
})
```
