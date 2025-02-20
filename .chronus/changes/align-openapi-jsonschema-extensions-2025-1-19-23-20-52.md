---
changeKind: feature
packages:
  - "@typespec/openapi"
---

Updates the `@extension` decorator with 3 changes:

1. Removes the extension name starts with `x-` constraint.
1. Adds support for passing in values to emit raw data.
1. Adds a deprecation warning for passing in types. Passed in types will emit Open API schemas in a future release.
