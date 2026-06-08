---
changeKind: feature
packages:
  - "@typespec/http-client-python"
---

Add `generate-api-md` emitter option to generate an `api.md` file containing the public API surface. When enabled, the emitter runs `apiview-stub-generator` to produce a token JSON file and converts it to markdown. Requires `apiview-stub-generator` to be installed in the Python environment.

```yaml
# tspconfig.yaml
options:
  "@typespec/http-client-python":
    generate-api-md: true
```
