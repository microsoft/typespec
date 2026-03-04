---
changeKind: fix
packages:
  - "@typespec/http-server-js"
---

Fix `createPolicyChain` to return a `Promise` when policies are specified, preventing `TypeError: Cannot read properties of undefined (reading 'catch')` when using global policies.
