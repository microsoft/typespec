---
title: "Decorators"
description: "Decorators exported by @typespec/graphql"
toc_min_heading_level: 2
toc_max_heading_level: 3
---

## TypeSpec.GraphQL

### `@compose` {#@TypeSpec.GraphQL.compose}

Specify the GraphQL interfaces that should be implemented by a model.
The interfaces must be decorated with the `@graphqlInterface` decorator,
and all of the interfaces' properties must be present and compatible.

```typespec
@TypeSpec.GraphQL.compose(...interfaces: Model[])
```

#### Target

`Model`

#### Parameters

| Name       | Type      | Description |
| ---------- | --------- | ----------- |
| interfaces | `Model[]` |             |

#### Examples

```typespec
@graphqlInterface(#{ interfaceOnly: true })
model Node {
  id: string;
}

@compose(Node)
model User {
  ...Node;
  name: string;
}
```

### `@graphqlInterface` {#@TypeSpec.GraphQL.graphqlInterface}

Mark this model as a GraphQL Interface. Interfaces can be implemented by other models
using the `@compose` decorator.

```typespec
@TypeSpec.GraphQL.graphqlInterface(options?: valueof { interfaceOnly: boolean })
```

#### Target

`Model`

#### Parameters

| Name    | Type            | Description                                                                                                                                                                                                                                                           |
| ------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| options | `valueof {...}` | .interfaceOnly When true, the model will only be emitted as an interface<br />(no "Interface" suffix is added to the name). Use this for abstract interfaces that<br />will never be used directly as output/input types (e.g., Node, Connection). Defaults to false. |

#### Examples

```typespec
@graphqlInterface(#{ interfaceOnly: true })
model Node {
  id: string;
}

@compose(Node)
model User {
  ...Node;
  name: string;
}
// Emits: interface Node { id: String! }
//        type User implements Node { id: String!; name: String! }
```

### `@mutation` {#@TypeSpec.GraphQL.mutation}

Specify the GraphQL Operation kind for the target operation to be `MUTATION`.

```typespec
@TypeSpec.GraphQL.mutation
```

#### Target

`Operation`

#### Parameters

None

#### Examples

```typespec
@mutation op createUser(name: string): User;
```

### `@operationFields` {#@TypeSpec.GraphQL.operationFields}

Assign one or more operations or interfaces to act as fields with arguments on a model.
The operations become fields on the GraphQL type with their parameters as arguments.

```typespec
@TypeSpec.GraphQL.operationFields(...operations: Operation | Interface[])
```

#### Target

`Model`

#### Parameters

| Name       | Type                       | Description |
| ---------- | -------------------------- | ----------- |
| operations | `Operation \| Interface[]` |             |

#### Examples

```typespec
op followers(query: string): Person[];

@operationFields(followers)
model Person {
  name: string;
}
// Emits: type Person { name: String!; followers(query: String!): [Person!]! }
```

### `@query` {#@TypeSpec.GraphQL.query}

Specify the GraphQL Operation kind for the target operation to be `QUERY`.

```typespec
@TypeSpec.GraphQL.query
```

#### Target

`Operation`

#### Parameters

None

#### Examples

```typespec
@query op getUser(id: string): User;
```

### `@schema` {#@TypeSpec.GraphQL.schema}

Mark this namespace as describing a GraphQL schema and configure schema properties.
All types and operations within the namespace will be emitted to a single GraphQL schema file.

```typespec
@TypeSpec.GraphQL.schema(options?: valueof TypeSpec.GraphQL.Schema.SchemaOptions)
```

#### Target

`Namespace`

#### Parameters

| Name    | Type                                                                             | Description |
| ------- | -------------------------------------------------------------------------------- | ----------- |
| options | [valueof `SchemaOptions`](./data-types.md#TypeSpec.GraphQL.Schema.SchemaOptions) |             |

#### Examples

```typespec
@schema(#{ name: "MyAPI" })
namespace MyAPI {
  model User {
    id: string;
    name: string;
  }
  @query op getUser(id: string): User;
}
// Emits: MyAPI.graphql
```

### `@specifiedBy` {#@TypeSpec.GraphQL.specifiedBy}

Provide a specification URL for a custom GraphQL scalar type.
This maps to the `@specifiedBy` directive in the emitted GraphQL schema.

```typespec
@TypeSpec.GraphQL.specifiedBy(url: valueof url)
```

#### Target

`Scalar`

#### Parameters

| Name | Type          | Description                          |
| ---- | ------------- | ------------------------------------ |
| url  | `valueof url` | URL to the scalar type specification |

#### Examples

```typespec
@specifiedBy("https://scalars.graphql.org/andimarek/date-time")
scalar DateTime extends utcDateTime;
```

### `@subscription` {#@TypeSpec.GraphQL.subscription}

Specify the GraphQL Operation kind for the target operation to be `SUBSCRIPTION`.

```typespec
@TypeSpec.GraphQL.subscription
```

#### Target

`Operation`

#### Parameters

None

#### Examples

```typespec
@subscription op onUserCreated(): User;
```
