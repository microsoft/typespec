---
changeKind: fix
packages:
  - "@typespec/http-client-java"
---

Generate protocol and ClientCore polling utility methods independently based on referenced calls, static imports, method references, and constants. Preserve only required private dependencies and imports, and omit unused utilities entirely.
