---
changeKind: feature
packages:
  - "@typespec/compiler"
---

Add a `docs` field to linter rule and diagnostic definitions to provide extended reference documentation. The value can be an inline markdown string or a `FileRef` created with `fileRef.fromPackageRoot("src/rules/my-rule.md")`, which is read lazily by tooling so it stays safe to bundle for the browser.

```ts
export const myRule = createRule({
  name: "my-rule",
  severity: "warning",
  description: "Short description.",
  docs: fileRef.fromPackageRoot("src/rules/my-rule.md"),
  messages: {
    /* ... */
  },
});
```
