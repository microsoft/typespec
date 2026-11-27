---
changeKind: feature
packages:
  - "@typespec/playground"
---

Preserve native compiler configuration in playground samples, including experimental feature flags.

```ts
const sample = {
  content: "model Widget {}",
  tspconfig: "features:\n  - auto-decorators\n  - scoped-decorators\n",
};
```