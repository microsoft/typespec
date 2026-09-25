---
changeKind: deprecation
packages:
  - "@typespec/json-schema"
---

The metadata-only decorators of this library are now declared as `auto dec`, so the compiler
synthesizes their implementation and provides typed accessors. This affects `@baseUri`, `@id`,
`@oneOf`, `@multipleOf`, `@contains`, `@minContains`, `@maxContains`, `@uniqueItems`,
`@minProperties`, `@maxProperties`, `@contentEncoding`, `@contentMediaType`, `@contentSchema` and
`@prefixItems`.

Nothing changes for TypeSpec authors. For JavaScript consumers, the `$baseUri`-style implementation
functions and their `BaseUriDecorator`-style signature types are deprecated: they are no longer what
the compiler invokes. Use the generated `set*` accessor to apply a decorator programmatically:

```ts
// Before
context.call($minContains, target, 2);

// After
import { setMinContains } from "@typespec/json-schema";
setMinContains(program, target, 2);
```

Applying one of these decorators twice on the same declaration now reports a `duplicate-decorator`
warning. The last application still wins.
