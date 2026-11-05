---
changeKind: feature
packages:
  - "@typespec/openapi3"
---

Add independent component naming options for namespace qualification and alphanumeric-only schema and reusable parameter keys. Existing defaults are unchanged.

For AWS API Gateway-compatible model names:

```yaml
options:
  "@typespec/openapi3":
    component-name-character-set: alphanumeric
```

Use `component-name-strategy: name-only` to omit namespaces, or configure `{ kind: fqn, separator: "_" }` to change segment separators. Empty names and collisions after transformation are errors.