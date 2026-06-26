---
changeKind: fix
packages:
  - "@typespec/http-client-python"
---

Fix invalid lone `@overload` generated for body parameters in `models-mode: typeddict`. When the binary and JSON overloads are omitted, the single remaining body variant is now emitted as a plain parameter instead of a single `@overload`, which mypy rejects with "Single overload definition, multiple required".
