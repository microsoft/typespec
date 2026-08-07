---
changeKind: internal
packages:
  - "@typespec/http-server-csharp"
---

Build model, property and enum generation on `@typespec/emitter-framework` components

The emitter carried private forks of the framework's `ClassDeclaration`, `Property` and `EnumDeclaration`. They are now consumed directly, with the emitter's own behavior expressed as a declaration override and component props. Generated output is unchanged.
