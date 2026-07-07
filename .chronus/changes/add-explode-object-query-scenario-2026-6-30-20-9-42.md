---
changeKind: feature
packages:
  - "@typespec/http-specs"
---

Add `Routes_QueryParameters_QueryExpansion_Explode_model` scenario covering a named model-valued query parameter with explode expansion (`{?param*}`), which per RFC 6570 form explode expands each property into its own query entry (`?field=status&value=active`).
