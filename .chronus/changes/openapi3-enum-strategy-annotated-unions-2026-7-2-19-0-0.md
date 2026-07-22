---
changeKind: feature
packages:
  - "@typespec/openapi3"
---

Extend the `enum-strategy: annotated` emitter option to unions of literals. When set to `annotated`, a union whose variants are literals is emitted as a `oneOf`/`anyOf` of `const` subschemas with per-variant `title`/`description` taken from `@summary` and `@doc`, instead of collapsing to a single lossy `enum`. Supported for OpenAPI 3.1.0 and above; emitting with OpenAPI 3.0.0 falls back to the default form and reports a warning.

For example, the following TypeSpec:

```typespec
/** Set of known error types. */
union ErrorType {
  /** Common error for a bad request. */
  @summary("CommonBadRequest")
  commonBadRequest: "https://example.com/errors/bad-request",

  /** The request body could not be parsed. */
  @summary("InvalidBody")
  invalidBody: "https://example.com/errors/invalid-body",
}
```

emits:

```yaml
ErrorType:
  description: Set of known error types.
  anyOf:
    - const: https://example.com/errors/bad-request
      title: CommonBadRequest
      description: Common error for a bad request.
    - const: https://example.com/errors/invalid-body
      title: InvalidBody
      description: The request body could not be parsed.
```

Use `@oneOf` on the union to emit `oneOf` instead of `anyOf`.
