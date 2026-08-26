---
changeKind: fix
packages:
  - "@typespec/http-client-python"
---

Fix crash when generating with `models-mode=none`. Options passed to the `OptionsDict` constructor are now normalized through the same validation/transform path as `__setitem__`, so `models-mode=none` is correctly treated as falsy and a modelless client is produced instead of crashing.
