---
title: "Data types"
toc_min_heading_level: 2
toc_max_heading_level: 3
---



## TypeSpec.Streams

### `Stream` {#TypeSpec.Streams.Stream}

Defines a model that represents a stream protocol type whose data is described
by `Type`.

This can be useful when the underlying data type is not relevant, or to serve as
a base type for custom streams.

```typespec
model TypeSpec.Streams.Stream<Type>
```

#### Template Parameters

| Name | Description                    |
| ---- | ------------------------------ |
| Type | The type of the stream's data. |

#### Properties

None
