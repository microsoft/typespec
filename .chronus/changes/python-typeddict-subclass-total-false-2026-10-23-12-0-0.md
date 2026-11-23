---
changeKind: fix
packages:
  - "@typespec/http-client-python"
---

Fix optional fields of inherited models becoming required in the generated `types.py`. TypedDict subclasses are now declared with `total=False`, like base TypedDicts, because totality is not inherited. Required fields are still marked with `Required[...]`.
