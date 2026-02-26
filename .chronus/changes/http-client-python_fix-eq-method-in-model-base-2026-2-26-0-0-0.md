---
changeKind: fix
packages:
  - "@typespec/http-client-python"
---

Fix `__eq__` method in `_MyMutableMapping` to use `isinstance` check instead of attempting to construct a new instance from the other object.
