---
title: "Decorators"
toc_min_heading_level: 2
toc_max_heading_level: 3
---



## TypeSpec.Streams

### `@streamOf` {#@TypeSpec.Streams.streamOf}

Specify that a model represents a stream protocol type whose data is described
by `Type`.

```typespec
@TypeSpec.Streams.streamOf(type: unknown)
```

#### Target

`Model`

#### Parameters

| Name | Type      | Description                                             |
| ---- | --------- | ------------------------------------------------------- |
| type | `unknown` | The type that models the underlying data of the stream. |

#### Examples

```typespec
model Message {
  id: string;
  text: string;
}

@streamOf(Message)
model Response {
  @body body: string;
}
```
