---
changeKind: breaking
packages:
  - "@typespec/playground"
---

Move `registerMonacoDefaultWorkersForVite` from `@typespec/playground` to `@typespec/playground/vite/workers`. Update the import path; the registration call is unchanged.

Custom Vite configurations must exclude `@typespec/playground/vite/workers` from `optimizeDeps`. `definePlaygroundViteConfig` configures this automatically.
