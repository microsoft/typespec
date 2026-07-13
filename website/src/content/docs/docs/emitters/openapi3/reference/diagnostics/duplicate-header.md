---
title: "duplicate-header"
---

```text title="Id"
@typespec/openapi3/duplicate-header
```

**Severity:** error

This diagnostic is issued when a response header is defined more than once for a response of a specific status code.

To fix this issue, ensure that each response header is defined only once for each status code.

### Example

```yaml
responses:
  "200":
    description: Successful response
    headers:
      X-Rate-Limit:
        description: The number of allowed requests in the current period
        schema:
          type: integer
      X-Rate-Limit:
        description: The number of allowed requests in the current period
        schema:
          type: integer
```

In this example, the `X-Rate-Limit` header is defined twice for the `200` status code. To fix this issue, remove the duplicate header definition.
