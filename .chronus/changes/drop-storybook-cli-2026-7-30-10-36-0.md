---
changeKind: internal
packages:
  - "@typespec/playground"
---

Remove unused `@storybook/cli` dependency and update the playground storybook scripts to use the `storybook` CLI directly, dropping deprecated transitive dependencies (`rimraf@2`, `glob@7`, `inflight`)
