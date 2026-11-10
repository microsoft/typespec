---
title: "Data types"
description: "Data types exported by @typespec/json-schema"
llmstxt: true
---

## TypeSpec.JsonSchema

### `Json` {#TypeSpec.JsonSchema.Json}

Specify that the provided template argument should be emitted as raw JSON or YAML
as opposed to a schema. Use in combination with the `@extension` decorator. For example,
`@extension("x-schema", { x: "value" })` will emit a JSON schema value for `x-schema`,
whereas `@extension("x-schema", Json<{x: "value"}>)` will emit the raw JSON code
`{x: "value"}`.

```typespec
model TypeSpec.JsonSchema.Json<Data>
```

#### Template Parameters

| Name | Description                     |
| ---- | ------------------------------- |
| Data | the type to convert to raw JSON |

#### Properties

| Name  | Type   | Description                            |
| ----- | ------ | -------------------------------------- |
| value | `Data` | The value to emit as raw JSON or YAML. |

### `Format` {#TypeSpec.JsonSchema.Format}

Well-known JSON Schema formats.

```typespec
enum TypeSpec.JsonSchema.Format
```

| Name                | Value                     | Description                                                                                                                                                           |
| ------------------- | ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| dateTime            | `"date-time"`             | A date and time, as defined by the `date-time` production in [RFC 3339](https://datatracker.ietf.org/doc/html/rfc3339#section-5.6).                                   |
| date                | `"date"`                  | A calendar date, as defined by the `full-date` production in [RFC 3339](https://datatracker.ietf.org/doc/html/rfc3339#section-5.6).                                   |
| time                | `"time"`                  | A time of day, as defined by the `full-time` production in [RFC 3339](https://datatracker.ietf.org/doc/html/rfc3339#section-5.6).                                     |
| duration            | `"duration"`              | An ISO 8601 duration such as `P3DT4H5M`, as defined by the `duration` production in [RFC 3339, appendix A](https://datatracker.ietf.org/doc/html/rfc3339#appendix-A). |
| email               | `"email"`                 | An email address, as defined by the `addr-spec` production in [RFC 5322](https://datatracker.ietf.org/doc/html/rfc5322#section-3.4.1).                                |
| idnEmail            | `"idn-email"`             | An internationalized email address, as defined by [RFC 6531](https://datatracker.ietf.org/doc/html/rfc6531).                                                          |
| hostname            | `"hostname"`              | A host name, as defined by [RFC 1123](https://datatracker.ietf.org/doc/html/rfc1123#section-2.1).                                                                     |
| idnHostname         | `"idn-hostname"`          | An internationalized host name, as defined by [RFC 5890](https://datatracker.ietf.org/doc/html/rfc5890#section-2.3.2.3).                                              |
| ipv4                | `"ipv4"`                  | An IPv4 address, as defined by the `dotted-quad` production in [RFC 2673](https://datatracker.ietf.org/doc/html/rfc2673#section-3.2).                                 |
| ipv6                | `"ipv6"`                  | An IPv6 address, as defined by [RFC 4291](https://datatracker.ietf.org/doc/html/rfc4291#section-2.2).                                                                 |
| uri                 | `"uri"`                   | A URI, as defined by [RFC 3986](https://datatracker.ietf.org/doc/html/rfc3986).                                                                                       |
| uriReference        | `"uri-reference"`         | A URI reference, which may be relative, as defined by [RFC 3986](https://datatracker.ietf.org/doc/html/rfc3986#section-4.1).                                          |
| iri                 | `"iri"`                   | An internationalized resource identifier, as defined by [RFC 3987](https://datatracker.ietf.org/doc/html/rfc3987).                                                    |
| iriReference        | `"iri-reference"`         | An internationalized resource identifier reference, which may be relative, as defined by [RFC 3987](https://datatracker.ietf.org/doc/html/rfc3987).                   |
| uuid                | `"uuid"`                  | A universally unique identifier, as defined by [RFC 4122](https://datatracker.ietf.org/doc/html/rfc4122).                                                             |
| jsonPointer         | `"json-pointer"`          | A JSON pointer, as defined by [RFC 6901](https://datatracker.ietf.org/doc/html/rfc6901).                                                                              |
| relativeJsonPointer | `"relative-json-pointer"` | A relative JSON pointer, as defined by the [relative JSON pointer draft](https://datatracker.ietf.org/doc/html/draft-handrews-relative-json-pointer-01).              |
| regex               | `"regex"`                 | A regular expression, as defined by [ECMA-262](https://www.ecma-international.org/publications-and-standards/standards/ecma-262/).                                    |
