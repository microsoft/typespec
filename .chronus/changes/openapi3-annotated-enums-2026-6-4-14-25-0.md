---
changeKind: feature
packages:
  - "@typespec/openapi3"
---

Add `enum-mode` emitter option for OpenAPI 3.1+. When set to `"annotated"`, enums are emitted using the [annotated enumerations](https://spec.openapis.org/oas/v3.1.1.html#annotated-enumerations) pattern (`oneOf` of single-`const` subschemas with `title`/`description` from `@summary`/`@doc` on each member). The default `"enum"` preserves the existing flat `enum: [...]` output. The option has no effect on OpenAPI 3.0.

```yaml
options:
  "@typespec/openapi3":
    enum-mode: annotated
    openapi-versions: ["3.1.0"]
```
