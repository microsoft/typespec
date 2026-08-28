---
changeKind: fix
packages:
  - "@typespec/http-client-java"
---

Fix generated Javadoc corruption when a table cell value (parameter name/type/description, or response header name/type/description) contains a literal `*/` (e.g. an unconstrained `*/*` content type), which previously closed the surrounding `/** ... */` comment early.
