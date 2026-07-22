---
changeKind: feature
packages:
  - "@typespec/compiler"
---

Add `currentStage` property and `useCache` method to `Program` for stage-aware caching. `currentStage` tracks the compilation pipeline stage (parsing → checking → validating → linting → emitting), and `useCache` provides a generic caching mechanism that libraries can use to avoid redundant computation during later stages.
