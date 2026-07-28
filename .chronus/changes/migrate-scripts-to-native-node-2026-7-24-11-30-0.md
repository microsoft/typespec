---
changeKind: internal
packages:
  - "@typespec/compiler"
  - "@typespec/http-client-js"
  - "@typespec/http-server-js"
  - "@typespec/emitter-framework"
  - "@typespec/http-canonicalization"
  - "@typespec/http-server-csharp"
  - "@typespec/mutator-framework"
  - "@typespec/prettier-plugin-typespec"
---

Migrate build and dev scripts from `tsx` to native Node.js TypeScript execution. `tsx script.ts` invocations are now `node script.ts` (relying on Node's built-in type-stripping) and remaining plain `.js` scripts were converted to `.ts`. The unused `tsx` dependency was removed.
