---
changeKind: feature
packages:
  - "@typespec/compiler"
---

Add the foundation for sandboxed, permissioned execution of libraries and emitters. Libraries/emitters can declare the system capabilities they need via a permission manifest, and users approve them per emitter in `tspconfig.yaml`. By default an emitter/library is granted no access to any system API.

```ts
// In a library/emitter's `$lib`
export const $lib = createTypeSpecLibrary({
  name: "@typespec/openapi3",
  diagnostics: {},
  permissions: [
    { permission: { kind: "fs-read", paths: ["./schemas"] }, reason: "Read shared JSON schemas" },
    { permission: { kind: "network", hosts: ["*.example.com"] }, reason: "Resolve remote refs" },
  ],
});
```

```yaml
# tspconfig.yaml — the user authorizes what the emitter requested
permissions:
  "@typespec/openapi3":
    fs-read:
      - ./schemas
    network:
      - "*.example.com"
```
