---
title: "Data types"
toc_min_heading_level: 2
toc_max_heading_level: 3
---

# Data types

## TypeSpec.JsonSchema

### `Json` {#TypeSpec.JsonSchema.Json}

Specify that the provided template argument should be emitted as raw JSON or YAML
as opposed to a schema. Use in combination with the

```typespec
model TypeSpec.JsonSchema.Json<T>
```

#### Template Parameters

| Name | Description                     |
| ---- | ------------------------------- |
| T    | the type to convert to raw JSON |

### `Format` {#TypeSpec.JsonSchema.Format}

Well-known JSON Schema formats.

```typespec
enum TypeSpec.JsonSchema.Format
```
