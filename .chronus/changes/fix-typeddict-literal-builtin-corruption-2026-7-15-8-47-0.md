---
changeKind: fix
packages:
  - "@typespec/http-client-python"
---

Fix a bug where a TypedDict literal value that coincides with a Python builtin type name (e.g. `type: "type"`) was corrupted into `Literal["builtins.type"]` in the generated `types.py`. The builtin-shadowing workaround now ignores identifiers inside string literals (literal values and quoted forward references are left untouched) and detects shadowing against the actually-emitted annotation, so genuine sibling-builtin shadowing is still qualified while spurious `import builtins` statements are no longer emitted.
