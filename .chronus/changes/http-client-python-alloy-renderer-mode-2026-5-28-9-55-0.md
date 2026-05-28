---
changeKind: feature
packages:
  - "@typespec/http-client-python"
---

Add an experimental opt-in alloy + emitter-framework renderer. Set
`use-alloy-renderer: true` to bypass the existing `pygen` + Pyodide / native
Python path and emit Python directly from Node using alloy components over
the TCGC `SdkPackage`. The renderer currently emits only the package skeleton
(`pyproject.toml`, `README.md`, `<module>/__init__.py`, `<module>/_version.py`,
`<module>/py.typed`); models, clients, operations, paging, LROs, async
variants, and serialization helpers are intentionally deferred to follow-up
slices. The default behavior is unchanged.

```yaml
emit:
  - "@typespec/http-client-python"
options:
  "@typespec/http-client-python":
    use-alloy-renderer: true
```
