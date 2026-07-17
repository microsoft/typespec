---
changeKind: feature
packages:
  - "@typespec/compiler"
---

Add a `referenceDocs.baseUrl` field to the library definition passed to `createTypeSpecLibrary`. When set, the compiler auto-generates the `url` of each documented diagnostic and linter rule that does not specify one explicitly, so tooling (CLI and editor) can link to the generated reference pages without hardcoding a URL per rule/diagnostic:

- diagnostics -> `${baseUrl}/diagnostics/<code>`
- linter rules -> `${baseUrl}/rules/<name>`

```ts
export const $lib = createTypeSpecLibrary({
  name: "@typespec/my-lib",
  referenceDocs: { baseUrl: "https://typespec.io/docs/libraries/my-lib/reference" },
  diagnostics: {
    /* ... */
  },
});
```
