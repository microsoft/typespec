---
id: providing-info
title: Providing IDE & tooling info
---

Libraries can contribute extra, domain-specific information about types that is not part of
the core language — for example, `@typespec/http` surfaces the effective HTTP route of an
operation. This information is shown in IDE hover tooltips and can also be queried
programmatically by tooling (such as AI agents).

:::caution
This is an experimental feature. It must be enabled with the `type-info-hook`
[compiler feature flag](../handbook/configuration/configuration.md) in your `tspconfig.yaml`:

```yaml
features:
  - type-info-hook
```

:::

## The `$onInfo` hook

A library provides this information by exporting an `$onInfo` function from its main entry
point. Use the `defineInfoHook` helper for typing. The hook receives an `InfoContext` (with
the current `program` and the `target` type) and returns a single `TypeInfo` object, or
`undefined` when it has nothing to contribute.

```ts
import { defineInfoHook } from "@typespec/compiler";
import { getHttpOperation } from "./operations.js";

export const $onInfo = defineInfoHook(({ program, target }) => {
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

## Important constraints

Unlike [`$onValidate`](./diagnostics.md), the `$onInfo` hook:

- **is never run during compilation.** It is invoked lazily and on demand.
- **must not mutate the type graph.** It should only read the program and answer questions
  about it.

Because it does not change the type graph, there are no ordering or race concerns between
libraries — the `content` from every library is simply concatenated.

## Querying info programmatically

Tooling can query all registered providers for a given type with `program.getTypeInfo`,
which merges the contributions from every library into a single `TypeInfo` (or `undefined`
when nothing is contributed or the feature is disabled):

```ts
const info = program.getTypeInfo(type);
// { content: "`HTTP Route`: `GET /pets/{id}`\n\n`Responses`: `204`" }
```

The language server uses this same API to enrich hover documentation.
