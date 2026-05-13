---
changeKind: fix
packages:
  - "@typespec/http-client-python"
---

Fix typing in generated paging operations when an operation is named `list` and the page item is a collection type. The return type annotation now correctly uses the `List` alias (e.g. `AsyncItemPaged[List[str]]`) instead of the built-in `list` (which would shadow the operation name) to stay consistent with other annotations in the same file.
