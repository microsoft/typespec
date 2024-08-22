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
model TypeSpec.JsonSchema.Json<Data>
```

#### Template Parameters

| Name | Description                     |
| ---- | ------------------------------- |
| Data | the type to convert to raw JSON |

#### Properties

| Name  | Type   | Description |
| ----- | ------ | ----------- |
| value | `Data` |             |

### `Format` {#TypeSpec.JsonSchema.Format}

Well-known JSON Schema formats.

```typespec
enum TypeSpec.JsonSchema.Format
```

| Name                | Value                     | Description |
| ------------------- | ------------------------- | ----------- |
| dateTime            | `"date-time"`             |             |
| date                | `"date"`                  |             |
| time                | `"time"`                  |             |
| duration            | `"duration"`              |             |
| email               | `"email"`                 |             |
| idnEmail            | `"idn-email"`             |             |
| hostname            | `"hostname"`              |             |
| idnHostname         | `"idn-hostname"`          |             |
| ipv4                | `"ipv4"`                  |             |
| ipv6                | `"ipv6"`                  |             |
| uri                 | `"uri"`                   |             |
| uriReference        | `"uri-reference"`         |             |
| iri                 | `"iri"`                   |             |
| iriReference        | `"iri-reference"`         |             |
| uuid                | `"uuid"`                  |             |
| jsonPointer         | `"json-pointer"`          |             |
| relativeJsonPointer | `"relative-json-pointer"` |             |
| regex               | `"regex"`                 |             |
