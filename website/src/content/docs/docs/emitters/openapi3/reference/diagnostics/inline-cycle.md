---
title: "inline-cycle"
---

```text title="Id"
@typespec/openapi3/inline-cycle
```

This diagnostic is issued when a cyclic reference is detected within inline schemas.

To fix this issue, refactor the schemas to remove the cyclic reference.

### Example

```yaml
components:
  schemas:
    Node:
      type: object
      properties:
        value:
          type: string
        next:
          $ref: "#/components/schemas/Node"
```

In this example, the `Node` schema references itself, creating a cyclic reference. To fix this issue, refactor the schema to remove the cyclic reference.
