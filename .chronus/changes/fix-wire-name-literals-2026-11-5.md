---
changeKind: fix
packages:
  - "@typespec/http-client-python"
---

Fix wire names with quotes in generated request-builder code by escaping them through the shared string-literal helper, preserving the existing single-quoted output for popped header/query kwargs.
