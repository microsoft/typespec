---
changeKind: feature
packages:
  - "@typespec/http-client-py"
---

Initial scaffold for `@typespec/http-client-py`, a new TypeSpec Python HTTP client emitter built on `@alloy-js/python` and the `@typespec/emitter-framework/python` components. Phase 1 emits a complete Python package layout (`pyproject.toml`, `README.md`, `__init__.py`, `_version.py`, `py.typed`), models (dataclasses + Enum), and a body-less client class whose methods raise `NotImplementedError`. Operations, serialization, auth, paging, and LRO are deferred to follow-up releases.

```tsp
@service(#{ title: "WidgetService" })
namespace WidgetService;

enum Color { red, green, blue }
model Widget { id: string; name: string; color: Color }

@route("/widgets") @get op listWidgets(): Widget[];
```

Compile with `tsp compile main.tsp --emit @typespec/http-client-py` to generate a Python package targeting the `corehttp` runtime.