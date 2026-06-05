---
changeKind: feature
packages:
  - "@typespec/compiler"
---

`ApplyCodeFixExpect.toEqual` now accepts `Record<string, string>` to assert on multiple files after a code fix is applied. This enables testing code fixes that write to a different file (e.g., adding augment decorators to a `client.tsp`).

```ts
await ruleTester
  .expect({
    "main.tsp": `import "./client.tsp";\nmodel Foo { name: string; }`,
    "client.tsp": ``,
  })
  .applyCodeFix("add-client-override")
  .toEqual({
    "client.tsp": `@@override(Foo.name, "clientName");\n`,
  });
```
