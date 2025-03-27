---
changeKind: internal
packages:
  - "@typespec/http-client-js"
  - "@typespec/website"
---

Consolidate client emitter options in lib.ts and add @typespec/http-client-js as a dev dependency to the website package. This allows the website to regenerate the docs for the emitter.
