---
title: "Data types"
description: "Data types exported by @typespec/graphql"
---

## TypeSpec.GraphQL

### `ID` {#TypeSpec.GraphQL.ID}

Represents a GraphQL ID scalar — a unique identifier serialized as a string.

```typespec
scalar TypeSpec.GraphQL.ID
```

#### Examples

```typespec
model User {
  id: GraphQL.ID;
  name: string;
}
```

## TypeSpec.GraphQL.Schema

### `SchemaOptions` {#TypeSpec.GraphQL.Schema.SchemaOptions}

Options for configuring a GraphQL schema.

```typespec
model TypeSpec.GraphQL.Schema.SchemaOptions
```

#### Properties

| Name  | Type     | Description                                                                                                                                       |
| ----- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| name? | `string` | The name of the GraphQL schema. Used in the output filename when emitting<br />multiple schemas (e.g., `{name}.graphql`). Defaults to `"schema"`. |
