---
changeKind: fix
packages:
  - "@typespec/compiler"
---

Fix directory entrypoint resolution ignoring `package.json` `tspMain` when a `tspconfig.yaml` with `kind: project` is present but does not specify an `entrypoint`. The resolution order is now: explicit config `entrypoint`, then `package.json` `tspMain`, then `main.tsp`.
