---
changeKind: fix
packages:
  - "@typespec/openapi3"
---

Include the required discriminator property in schemas for variants of `@discriminated(#{ envelope: "none" })` unions, without changing payload models used outside the union.
