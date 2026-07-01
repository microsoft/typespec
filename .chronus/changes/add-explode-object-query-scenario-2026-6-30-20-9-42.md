---
changeKind: feature
packages:
  - "@typespec/http-specs"
---

Add `Parameters_Query_Explode_object` scenario covering a model-valued query parameter with `@query(#{ explode: true })`, which per RFC 6570 form explode expands each property into its own query entry (`?field=status&value=active`).
