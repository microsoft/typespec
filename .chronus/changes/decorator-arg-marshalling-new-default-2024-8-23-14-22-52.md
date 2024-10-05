---
changeKind: breaking
packages:
  - "@typespec/compiler"
---

API: Update default of `decoratorArgMarshalling` from `legacy` to `new`

To revert to the old behavior export the following. **Highly discouraged, this will be removed in a few versions.**

```ts
export const $flags = definePackageFlags({
  decoratorArgMarshalling: "legacy",
});
```
