---
changeKind: feature
packages:
  - "@typespec/compiler"
---

Add a new experimental `$provideTypeInfo` library provider and `program.getTypeInfo(type)` API allowing libraries to contribute extra, domain-specific information about types. Unlike the `$onValidate` lifecycle hook, a provider never runs during compilation and must not mutate the type graph — it is invoked lazily and on demand (e.g. by the language server for hover documentation, or by tooling querying the type).

Providers are gated by the `type-info-provider` compiler feature, scoped to the package that declares it: a library opts in via its own `tspconfig.yaml` and consumers do not need to enable anything.

```ts
// A library exports a provider (use `defineTypeInfoProvider` for typing):
export const $provideTypeInfo = defineTypeInfoProvider(({ program, target }) => {
  if (target.kind !== "Operation") return undefined;
  return { content: "extra info about this operation" };
});

// Tooling / language server queries it (merges every library's contribution):
const info = program.getTypeInfo(type);
```
