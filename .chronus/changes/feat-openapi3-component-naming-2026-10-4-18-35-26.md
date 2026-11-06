---
changeKind: feature
packages:
  - "@typespec/openapi3"
---

Add `component-name-strategy` to control namespace qualification and segment separators for OpenAPI schema and reusable parameter keys. Existing defaults are unchanged.

```yaml
options:
  "@typespec/openapi3":
    component-name-strategy: name-only
```

Use `name-only` to omit namespaces, or configure `{ kind: fqn, separator: "_" }` to change segment separators. Characters within identifiers and friendly names remain unchanged. Collisions after namespace changes are errors.