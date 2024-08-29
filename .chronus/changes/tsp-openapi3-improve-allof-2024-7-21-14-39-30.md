---
changeKind: fix
packages:
  - "@typespec/openapi3"
---

Improves tsp-openapi3 model generation from schemas utilizing allOf. Models will now extend an allOf member if it is a schema reference and the only member with a discriminator. Other members will be spread into the model if defined as a schema reference, or have their properties treated as top-level properties if they are an inline-schema.