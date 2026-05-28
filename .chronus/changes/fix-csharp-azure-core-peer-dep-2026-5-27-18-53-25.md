---
changeKind: fix
packages:
  - "@typespec/http-client-csharp"
---

Declare `@azure-tools/typespec-azure-core` as a peer dependency. The emitter imports from this package at runtime but previously relied on npm's flat hoisting to resolve it, which caused failures under pnpm (with `enableGlobalVirtualStore: true`) and other strict resolvers.
