---
changeKind: fix
packages:
  - "@typespec/http-server-js"
---

Ignore unfinished types when visiting service namespace for completeness. This avoids crashes that result from encountering TemplateParameter instances.
