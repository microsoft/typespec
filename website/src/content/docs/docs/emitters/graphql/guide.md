---
title: Guide
---

The GraphQL emitter (`@typespec/graphql`) generates GraphQL Schema Definition Language (SDL) from TypeSpec sources. The generated schemas can be used with any GraphQL server implementation.

## Fundamental Concepts

The GraphQL emitter transforms TypeSpec models, operations, and enums into their GraphQL equivalents. To generate a valid GraphQL schema, your TypeSpec must follow certain conventions.

### Schemas

A GraphQL schema is defined by applying the [`@schema`](../reference/decorators#@TypeSpec.GraphQL.schema) decorator to a TypeSpec namespace. All types and operations within the namespace will be emitted to a single GraphQL schema file.

```typespec
import "@typespec/graphql";

using GraphQL;

@schema
namespace MyService {
// Types and operations go here

}
```

You can optionally specify a name for the schema, which will be used in the output filename:

```typespec
@schema(#{ name: "petstore" })
namespace PetStore {
// ...

}
```

This will generate a file named `petstore.graphql`.

### Object Types

TypeSpec models are transformed into GraphQL object types. For example:

```typespec
model Pet {
  id: string;
  name: string;
  age: int32;
}
```

Becomes:

```graphql
type Pet {
  id: String!
  name: String!
  age: Int!
}
```

Note that all fields are non-nullable (`!`) by default in GraphQL. See [Nullability](#nullability) for how to make fields nullable.

### Operations

GraphQL supports three operation types: queries, mutations, and subscriptions. Use the corresponding decorators to specify the operation kind:

```typespec
@query op getPet(id: string): Pet;
@query op listPets(): Pet[];

@mutation op createPet(name: string, age: int32): Pet;
@mutation op deletePet(id: string): boolean;

@subscription op onPetCreated(): Pet;
```

This generates:

```graphql
type Query {
  getPet(id: String!): Pet!
  listPets: [Pet!]!
}

type Mutation {
  createPet(name: String!, age: Int!): Pet!
  deletePet(id: String!): Boolean!
}

type Subscription {
  onPetCreated: Pet!
}
```

### Input Types

When a model is used as an operation parameter (mutation input), the emitter automatically generates a corresponding GraphQL input type with an `Input` suffix:

```typespec
model Pet {
  name: string;
  age: int32;
}

@mutation op createPet(input: Pet): Pet;
```

Generates:

```graphql
input PetInput {
  name: String!
  age: Int!
}

type Mutation {
  createPet(input: PetInput!): Pet!
}
```

### Enums

TypeSpec enums map to GraphQL enums with member names converted to `CONSTANT_CASE`:

```typespec
enum PetStatus {
  Available,
  Pending,
  Sold,
}
```

Becomes:

```graphql
enum PetStatus {
  AVAILABLE
  PENDING
  SOLD
}
```

### Nullability

By default, all GraphQL types are non-nullable. To make a field or return type nullable, use TypeSpec's union with `null`:

```typespec
model Pet {
  id: string;
  nickname: string | null; // Nullable field
}

@query op findPet(id: string): Pet | null; // Nullable return
```

Generates:

```graphql
type Pet {
  id: String!
  nickname: String # No ! means nullable
}

type Query {
  findPet(id: String!): Pet # Nullable return
}
```

For nullable array elements, the emitter handles `Array<T | null>` patterns:

```typespec
model SearchResult {
  pets: (Pet | null)[];  # Array with nullable elements
}
```

Generates:

```graphql
type SearchResult {
  pets: [Pet]! # Non-null array, nullable elements
}
```

### Interfaces

GraphQL interfaces allow you to define a common set of fields that multiple types can implement. Use the [`@graphqlInterface`](../reference/decorators#@TypeSpec.GraphQL.graphqlInterface) decorator:

```typespec
@graphqlInterface(#{ interfaceOnly: true })
model Node {
  id: string;
}

@compose(Node)
model Pet {
  ...Node;
  name: string;
}
```

Generates:

```graphql
interface Node {
  id: String!
}

type Pet implements Node {
  id: String!
  name: String!
}
```

The `interfaceOnly` option prevents the model from also being emitted as an object type (useful for abstract interfaces like `Node`).

## Type Mappings

| TypeSpec Type        | GraphQL Type   |
| -------------------- | -------------- |
| `string`             | `String`       |
| `boolean`            | `Boolean`      |
| `int32`              | `Int`          |
| `float32`, `float64` | `Float`        |
| `GraphQL.ID`         | `ID`           |
| `T[]`                | `[T!]!`        |
| `T \| null`          | `T` (nullable) |

## Example Configuration

To use the GraphQL emitter, add it to your `tspconfig.yaml`:

```yaml
emit:
  - "@typespec/graphql"
```

The emitter will generate `.graphql` files in your output directory.
