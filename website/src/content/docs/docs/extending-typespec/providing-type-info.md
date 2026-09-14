---
id: providing-type-info
title: Providing type info to IDEs & tooling
---

Libraries can contribute extra, domain-specific information about types that is not part of
the core language — for example, `@typespec/http` surfaces the effective HTTP route of an
operation. This information is shown in IDE hover tooltips and can also be queried
programmatically by tooling (such as AI agents).

:::caution
This is an experimental feature. A library must opt in by enabling the `type-info-provider`
[compiler feature](../handbook/configuration/configuration.mdx) in **its own** `tspconfig.yaml`:

```yaml
kind: project
features:
  - type-info-provider
```

The opt-in is scoped to the package declaring the provider — consumers of the library do not
need to enable anything to see the information.

Because the opt-in is read from the published package, make sure `tspconfig.yaml` is actually
shipped — add it to `files` in your `package.json`, otherwise the provider is silently ignored
once the library is installed from a registry:

```json
{
  "files": ["lib/**/*.tsp", "tspconfig.yaml", "dist/**"]
}
```

:::

## The `$provideTypeInfo` provider

A library provides this information by exporting a `$provideTypeInfo` function from its main
entry point. Use the `defineTypeInfoProvider` helper for typing. The provider receives a
`TypeInfoContext` (with the current `program` and the `target` type) and returns a single
`TypeInfo` object, or `undefined` when it has nothing to contribute.

```ts
import { defineTypeInfoProvider } from "@typespec/compiler";
import { getHttpOperation } from "./operations.js";

export const $provideTypeInfo = defineTypeInfoProvider(({ program, target }) => {
  if (target.kind !== "Operation") {
    return undefined;
  }
  const [operation] = getHttpOperation(program, target);
  if (!operation) {
    return undefined;
  }
  return {
    content: `\`HTTP Route\`: \`${operation.verb.toUpperCase()} ${operation.uriTemplate}\``,
  };
});
```

A `TypeInfo` currently has a single `content` field: the markdown content to show for this
piece of information.

## How it is displayed

In the IDE, the contributed content is appended after the type's signature and documentation,
separated by a horizontal rule so it is clearly distinguishable from the type's own doc
comment:

```md
op read(id: string): void

Reads a pet.

---

`HTTP Route`: `GET /pets/{id}`

`Responses`: `204`
```

## Important constraints

Unlike the [`$onValidate`](./diagnostics.md) lifecycle hook, a `$provideTypeInfo` provider:

- **is never run during compilation.** It is invoked lazily and on demand.
- **must not mutate the type graph.** It should only read the program and answer questions
  about it.

Because it does not change the type graph, there are no ordering or race concerns between
libraries — the `content` from every library is simply concatenated.

## Querying info programmatically

Tooling can query all registered providers for a given type with `program.getTypeInfo`,
which merges the contributions from every library into a single `TypeInfo` (or `undefined`
when nothing is contributed):

```ts
const info = program.getTypeInfo(type);
// { content: "`HTTP Route`: `GET /pets/{id}`\n\n`Responses`: `204`" }
```

The language server uses this same API to enrich hover documentation.
