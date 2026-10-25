---
changeKind: fix
packages:
  - "@typespec/http-client-python"
---

Limit Black formatting and pylint suppression insertion to Python files written during the current generation, leaving pre-existing user-managed tests, samples, and other Python files unchanged.
