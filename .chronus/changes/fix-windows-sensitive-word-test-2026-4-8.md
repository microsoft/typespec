---
changeKind: internal
packages:
  - "@typespec/http-client-python"
---
Fix `test_sensitive_word` failing on Windows by replacing shell-based search with pure Python `pathlib` implementation.
