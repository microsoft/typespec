---
title: Encoding of types
---

This document describe how the http library interpret TypeSpec built-in types and how to configure

## `bytes`

**Default behavior:**

- `bytes` are serialized as `base64` when used inside a model serialized as JSON
- In request or response body it represent a binary payload.

:::note
This behavior is only a specification and MUST be respected by the emitter. The http library DOES NOT automatically apply the `@encode("base64")` when used inside a JSON model.
:::

Use `@encode` to configure

```tsp
model Pet {
  icon: bytes; // Serialize as base64
  @encode(BytesKnownEncoding.base64url) // Serialize as base64url
  other: bytes;
}

op read(): Pet;

op download(): bytes; // Return application/octet-stream
op upload(@body data: bytes): void; // Accept application/octet-stream
```

## `utcDatetime` and `offsetDateTime`

**Default behavior:**

- Encoded as `rfc7231` when used in a header
- Encoded as `rfc3339` otherwise.

:::note
This behavior is only a specification and MUST be respected by the emitter. The http library DOES NOT automatically apply the `@encode("rfc7231")` on `utcDatetime` and `offsetDateTime` when used in a header.
:::

Use `@encode` to configure.

<table>
<tr><td>TypeSpec</td><td>Example payload</td></tr>
<tr>
<td>

```tsp
model User {
  // Headers
  @header("Created-At") createdAtHeader: utcDateTime;

  @header("Created-At-Rfc3339")
  @encode(DateTimeKnownEncoding.rfc3339)
  createdAtHeaderRfc3339Encoding: utcDateTime;

  // In Json payload
  createdAt: utcDateTime; // rfc3339

  updatedAt: offsetDateTime; // rfc3339

  @encode(DateTimeKnownEncoding.rfc7231)
  createdAtPretty: utcDateTime; // rfc7231

  @encode(DateTimeKnownEncoding.rfc7231)
  updatedAtPretty: offsetDateTime; // rfc7231

  @encode(DateTimeKnownEncoding.unixTimestamp, int32)
  createdAtUnix: utcDateTime; // unixTime in seconds
}
```

</td>
<td>

```yaml
Created-At: Wed, 12 Oct 2022 07:20:50 GMT
Created-At-Rfc3339: 2022-10-12T07:20:50.52Z
```

```json
{
  "createdAt": "2022-10-12T07:20:50.52Z",
  "updatedAt": "2022-10-25T07:20:50.52+07:00",
  "createdAtPretty": "Wed, 12 Oct 2022 07:20:50 GMT",
  "updatedAtPretty": "Tue, 25 Oct 2022 00:20:50 GMT",
  "createdAtUnix": 1493938410
}
```

</td>
</tr>
</table>

## `duration`

**Default behavior:**

- Encoded as `ISO8601`

Use `@encode` to configure.

<table>
<tr><td>TypeSpec</td><td>Example payload</td></tr>
<tr>
<td>

```tsp
model User {
  runtime: duration; // ISO8601

  @encode(DurationKnownEncoding.seconds, int32)
  runtimeInSecondsInt: duration; // in seconds as an int32

  @encode(DurationKnownEncoding.seconds, float32)
  runtimeInSecondsFloat: duration; // in seconds as a float32
}
```

</td>
<td>

```json
{
  "runtime": "PT5M5S",
  "runtimeInSecondsInt": "305",
  "runtimeInSecondsFloat": "305.0"
}
```

</td>
</tr>
</table>

## Numeric types ( `int64`, `decimal128`, `float64`, etc.)

By default numeric types are serialized as a JSON number. However for large types like `int64` or `decimal128` that cannot be represented in certain languages like JavaScript it is recommended to serialize them as string over the wire.

<table>
<tr><td>TypeSpec</td><td>Example payload</td></tr>
<tr>
<td>

```tsp
model User {
  id: int64; // JSON number

  @encode(string)
  idAsString: int64; // JSON string

  viaSalar: decimalString;
}

@encode(string)
scalar decimalString extends decimal128;
```

</td>
<td>

```json
{
  "id": 1234567890123456789012345678901234567890,
  "idAsString": "1234567890123456789012345678901234567890",
  "viaSalar": "1.3"
}
```

</td>
</tr>
</table>
