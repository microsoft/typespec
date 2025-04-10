---
changeKind: fix
packages:
  - "@typespec/http-server-js"
---

Correctly ignore uninstantiated operations that are direct children of namespaces. This prevents a fatal error where TemplateParameter types can be encountered in such templates.