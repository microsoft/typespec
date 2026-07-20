---
changeKind: feature
packages:
  - "@typespec/compiler"
  - "@typespec/http"
---

Add `currentStage` property and `useCache` method to `Program` for stage-aware caching. Cache HTTP operation resolution at the program level so multiple callers (validators, linter rules, emitters) share results without redundant recomputation. Caching is automatically disabled during the checking stage to prevent stale results from decorator-phase calls.
