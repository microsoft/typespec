---
changeKind: fix
packages:
  - "@typespec/http-client-python"
---

Fix generated `models/__init__.py` being overwritten with a pkgutil namespace init when an operation group shares the same directory path as the models folder (e.g. a `Models` operation group conflicting with `specialwords/models/`). This caused `ImportError` when importing the generated client.
