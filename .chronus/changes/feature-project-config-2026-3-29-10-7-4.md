---
changeKind: feature
packages:
  - "@typespec/compiler"
---

Add `kind: project` and `entrypoint` support to `tspconfig.yaml` for defining project boundaries and entrypoint resolution. See [Project Configuration](https://typespec.io/docs/handbook/configuration/configuration#project-configuration) for more details.

```yaml title=tspconfig.yaml
kind: project
entrypoint: src/service.tsp
emit:
  - "@typespec/openapi3"
```
