---
changeKind: fix
packages:
  - "@typespec/http-client-python"
---

Clarify docstrings in the generated `_MyMutableMapping` base class in `_model_base.py` so they no longer use the ambiguous `D` placeholder (e.g. `Remove all items from D.` is now `Remove all items from the dictionary.`)
