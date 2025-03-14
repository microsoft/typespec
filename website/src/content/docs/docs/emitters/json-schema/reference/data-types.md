---
title: "Data types"
---

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
| value | `Data` | The value to be emitted as raw JSON or YAML. |

#### Example

```typespec
model ExampleModel {
  name: string;
  age: int32;
}

model RawJsonExample is Json<ExampleModel>;
```

In this example, `RawJsonExample` will be emitted as raw JSON or YAML instead of a schema.


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
| regex               | `"regex"`                 | A regular expression. |

#### Example

```typespec
model ExampleModel {
  @format(Format.dateTime)
  timestamp: string;
}
```

In this example, the `timestamp` property will be emitted with the `date-time` format in the JSON Schema.
