---
changeKind: fix
packages:
  - "@typespec/http-client-python"
---

Fix generated request builders serializing a `None` `content-type` header for an
operation with an optional body whose content-type is required/constant. The
`content-type` kwarg is now declared `Optional[str]` and the header is omitted
when it is `None`, instead of raising `ValueError: No value for given attribute`.
