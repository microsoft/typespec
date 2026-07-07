---
changeKind: feature
packages:
  - "@typespec/http-client-python"
---

Export generated `TypedDict` types (and their `Union`/`Literal` aliases from `types.py`) from the namespace-root `__init__.py` in `dpg` and `typeddict` models modes, so they can be imported directly from the package:

```python
from my_package import MyModel  # previously only reachable via `from my_package import types`
```
