---
changeKind: fix
packages:
  - "@typespec/http-client-python"
---

Fix Sphinx docstring rendering when a `Required.` (or other) annotation followed a code block. The annotation is now inserted into the prose before the code block instead of being appended after it.
