---
changeKind: feature
packages:
  - "@typespec/compiler"
---

Add support for short diagnostic and linter rule names. Diagnostic/rule codes can now be referenced by their scope-stripped short name (e.g. `http/no-foo` instead of `@typespec/http/no-foo`) or by a library-declared `alias`, both in `#suppress` directives and in the `linter` section of `tspconfig.yaml`. The full name is always accepted.

```tsp
model Post {
  #suppress "http/no-service-found" "standard library route"
  author: LegacyUser;
}
```

Libraries can declare a custom alias:

```ts
export const $lib = createTypeSpecLibrary({
  name: "@azure-tools/typespec-client-generator-core",
  alias: "tcgc",
  diagnostics: {
    /* ... */
  },
} as const);
```
