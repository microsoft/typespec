---
changeKind: feature
packages:
  - "@typespec/library-linter"
---

Validate that rules and rulesets referenced by the rulesets a library defines actually exist. Previously a dangling reference was only reported when a consumer happened to extend the offending ruleset.

```ts
export const $linter = defineLinter({
  rules: [casingRule],
  ruleSets: {
    recommended: {
      // warning: Rule 'removed-rule' referenced by ruleset '@typespec/best-practices/recommended'
      // is not defined in library '@typespec/best-practices'.
      enable: { "@typespec/best-practices/removed-rule": true },
    },
  },
});
```

References to a library that is not part of the compilation are skipped, and only the rulesets of the library being compiled are validated.
