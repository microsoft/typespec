---
title: "Data types (streams)"
description: "Data types exported by @typespec/http/streams"
llmstxt: true
---

## TypeSpec.Http.Streams

### `HttpStream` {#TypeSpec.Http.Streams.HttpStream}

Defines a model that represents a stream protocol type whose data is described
by `Type`.

The `ContentType` and `BodyType` describe how the stream is encoded over the wire,
while `Type` describes the data that the stream contains.

```typespec
model TypeSpec.Http.Streams.HttpStream<Type, ContentType, BodyType>
```

#### Template Parameters

| Name        | Description                             |
| ----------- | --------------------------------------- |
| Type        | The type of the stream's data.          |
| ContentType | The content type of the stream.         |
| BodyType    | The underlying wire type of the stream. |

#### Properties

| Name        | Type       | Description |
| ----------- | ---------- | ----------- |
| contentType | `string`   |             |
| body        | `BodyType` |             |

### `JsonlStream` {#TypeSpec.Http.Streams.JsonlStream}

Describes a stream of JSON data with one JSON object per line and sets
the content type to `application/jsonl`.

The JSON data is described by `Type`.

```typespec
model TypeSpec.Http.Streams.JsonlStream<Type>
```

#### Template Parameters

| Name | Description                                               |
| ---- | --------------------------------------------------------- |
| Type | The set of models describing the JSON data in the stream. |

#### Examples

```typespec
model Message {
  id: string;
  text: string;
}

@TypeSpec.Events.events
union Events {
  Message,
}

op subscribe(): JsonlStream<Events>;
```

#### Properties

| Name        | Type                  | Description |
| ----------- | --------------------- | ----------- |
| contentType | `"application/jsonl"` |             |
| body        | `string`              |             |
