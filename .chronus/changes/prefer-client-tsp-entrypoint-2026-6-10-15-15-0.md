---
changeKind: feature
packages:
  - "@typespec/compiler"
---

Default entrypoint resolution now prefers `client.tsp` over `main.tsp` when a project's `tspconfig.yaml` does not explicitly set `entrypoint` and a sibling `client.tsp` exists. This matches the convention used by `tsp-client` and allows augment decorators in `client.tsp` (e.g. `@@clientName`) to participate in compilation and linting without needing to add `imports: - ./client.tsp` to `tspconfig.yaml`.
