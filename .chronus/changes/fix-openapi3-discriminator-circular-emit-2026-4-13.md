---
changeKind: fix
packages:
  - "@typespec/openapi3"
---

Fix missing discriminator mapping entry when the first union variant causes a circular emit, affecting both the OpenAPI 3.0 and 3.2 emitters.
