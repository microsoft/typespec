---
changeKind: feature
packages:
  - "@typespec/compiler"
---

Add `Realm.asProgram()` returning a `Program`-shaped facade backed by the realm. The facade delegates pass-through members to the parent program and overrides `getGlobalNamespaceType()`, `stateMap`/`stateSet`, and the aggregate state collections so they reflect realm-local state. Together with namespace-rooted realm tracking via `Realm.setGlobalNamespace()` / `Realm.globalNamespace`, this lets the output of `mutateSubgraphWithNamespace` be consumed by the next stage as a `Program` — enabling chained `Program → Program` mutation pipelines without re-parsing TSP files. State-map reads on a clone fall back to the parent's state on the original type via a back-link recorded at clone time, preserving decorator state across the realm boundary.
