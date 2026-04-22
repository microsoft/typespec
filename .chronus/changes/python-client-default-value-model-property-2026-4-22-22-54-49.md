---
changeKind: fix
packages:
  - "@typespec/http-client-python"
---

Fix `@clientDefaultValue` on model properties to be included in the serialized request body. Previously, client default values for model properties were not passed through the emitter, causing the SDK to omit them when sending requests.
