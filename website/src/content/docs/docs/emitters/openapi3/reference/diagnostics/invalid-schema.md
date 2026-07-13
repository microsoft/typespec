---
title: "invalid-schema"
---

```text title="Id"
@typespec/openapi3/invalid-schema
```

**Severity:** error

This diagnostic is issued when a schema is invalid according to the OpenAPI v3 specification.

To fix this issue, review your TypeSpec definitions to ensure they map to valid OpenAPI schemas.

### Example

```yaml
components:
  schemas:
    User:
      type: object
      properties:
        id:
          type: string
        age:
          type: integer
          format: "int" # Invalid format
```

In this example, the `format` value for the `age` property is invalid. To fix this issue, provide a valid format value such as `int32` or `int64`.
