# @typespec/graphql

TypeSpec library and emitter for GraphQL.

Generates GraphQL SDL (Schema Definition Language) from TypeSpec source files.

## Install

```bash
npm install @typespec/graphql
```

## Emitter usage

### Via the command line

```bash
tsp compile . --emit=@typespec/graphql
```

### Via the config

```yaml
emit:
  - "@typespec/graphql"
```

The config can be extended with options as follows:

```yaml
emit:
  - "@typespec/graphql"
options:
  "@typespec/graphql":
    output-file: "schema.graphql"
```

## Emitter options

### `output-file`

**Type:** `string`

Name of the output file. Supports interpolation with `{schema-name}` for multi-schema scenarios.

**Default:** `{schema-name}.graphql`

### `new-line`

**Type:** `"lf" | "crlf"`

Set the newline character for emitting files.

**Default:** `lf`

### `omit-unreachable-types`

**Type:** `boolean`

Omit unreachable types. By default all types declared under the schema namespace will be included. With this flag on, only types referenced in an operation will be emitted.

**Default:** `false`

## Decorators

### TypeSpec.GraphQL

All decorators are in the `TypeSpec.GraphQL` namespace. You can use them with the fully qualified name (e.g., `@TypeSpec.GraphQL.query`) or import the namespace:

```typespec
using TypeSpec.GraphQL;

@query op getUser(id: string): User;
```

- [`@query`](#query)
- [`@mutation`](#mutation)
- [`@subscription`](#subscription)
- [`` @`interface` ``](#interface)
- [`@compose`](#compose)
- [`@operationFields`](#operationfields)
- [`@schema`](#schema)
- [`@specifiedBy`](#specifiedby)

#### `@query`

Specify the GraphQL Operation kind for the target operation to be `QUERY`.

```typespec
@query
```

##### Target

`Operation`

##### Parameters

None

##### Examples

```typespec
@query op getUser(id: string): User;
```

#### `@mutation`

Specify the GraphQL Operation kind for the target operation to be `MUTATION`.

```typespec
@mutation
```

##### Target

`Operation`

##### Parameters

None

##### Examples

```typespec
@mutation op createUser(name: string): User;
```

#### `@subscription`

Specify the GraphQL Operation kind for the target operation to be `SUBSCRIPTION`.

```typespec
@subscription
```

##### Target

`Operation`

##### Parameters

None

##### Examples

```typespec
@subscription op onUserCreated(): User;
```

#### `` @`interface` ``

Mark a model as a GraphQL Interface. Interfaces can be implemented by other models using `@compose`.

```typespec
@`interface`(options?: { interfaceOnly?: boolean })
```

##### Target

`Model`

##### Parameters

| Name          | Type                          | Description                                                                                                      |
| ------------- | ----------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| interfaceOnly | `valueof { interfaceOnly?: boolean }` | When true, the model will only be emitted as an interface (no "Interface" suffix). Defaults to false. |

##### Examples

```typespec
@`interface`(#{ interfaceOnly: true })
model Node {
  id: string;
}

@`interface`
model Reactable {
  reactions: Reaction[];
}
```

#### `@compose`

Specify the GraphQL interfaces that should be implemented by a model. The interfaces must be decorated with the `` @`interface` `` decorator, and all of the interfaces' properties must be present and compatible.

```typespec
@compose(...interfaces: Model[])
```

##### Target

`Model`

##### Parameters

| Name       | Type      | Description                                      |
| ---------- | --------- | ------------------------------------------------ |
| interfaces | `Model[]` | The interfaces that this model should implement. |

##### Examples

```typespec
@`interface`(#{ interfaceOnly: true })
model Node {
  id: string;
}

@compose(Node)
model User {
  ...Node;
  name: string;
}
```

#### `@operationFields`

Assign one or more operations or interfaces to act as fields with arguments on a model.

```typespec
@operationFields(...operations: (Operation | Interface)[])
```

##### Target

`Model`

##### Parameters

| Name       | Type                      | Description                                  |
| ---------- | ------------------------- | -------------------------------------------- |
| operations | `(Operation \| Interface)[]` | Operations to add as fields on this model. |

##### Examples

```typespec
@query op followers(query: string): Person[];

@operationFields(followers)
model Person {
  name: string;
}
```

This emits:

```graphql
type Person {
  name: String!
  followers(query: String!): [Person!]!
}
```

#### `@schema`

Mark a namespace as describing a GraphQL schema and configure schema properties.

```typespec
@schema(options?: { name?: string })
```

##### Target

`Namespace`

##### Parameters

| Name | Type                       | Description              |
| ---- | -------------------------- | ------------------------ |
| options | `valueof { name?: string }` | Schema configuration options. |

##### Examples

```typespec
@schema(#{ name: "MyAPI" })
namespace MyAPI {
  @query op getStatus(): string;
}
```

#### `@specifiedBy`

Provide a specification URL for a custom GraphQL scalar type. This maps to the `@specifiedBy` directive in the emitted GraphQL schema.

```typespec
@specifiedBy(url: valueof url)
```

##### Target

`Scalar`

##### Parameters

| Name | Type          | Description                              |
| ---- | ------------- | ---------------------------------------- |
| url  | `valueof url` | URL to the scalar type specification.    |

##### Examples

```typespec
@specifiedBy("https://scalars.graphql.org/andimarek/date-time")
scalar DateTime extends utcDateTime;
```

## Type mapping

TypeSpec types are mapped to GraphQL types as follows:

| TypeSpec          | GraphQL            |
| ----------------- | ------------------ |
| `string`          | `String`           |
| `boolean`         | `Boolean`          |
| `int32`           | `Int`              |
| `float32`         | `Float`            |
| `GraphQL.ID`      | `ID`               |
| `T[]`             | `[T!]!`            |
| `T \| null`       | `T` (nullable)     |
| `T?`              | `T` (nullable)     |
| Model             | `type` or `input`  |
| Enum              | `enum`             |
| Union             | `union`            |

## Input types

When a model is used as an operation parameter, it is automatically emitted as a GraphQL input type with the `Input` suffix:

```typespec
model User {
  id: string;
  name: string;
}

@mutation op createUser(user: User): User;
```

Emits:

```graphql
type User {
  id: String!
  name: String!
}

input UserInput {
  id: String!
  name: String!
}

type Mutation {
  createUser(user: UserInput!): User!
}
```

## Union handling

GraphQL unions can only contain object types. When a union contains scalar types, the emitter automatically wraps them in synthetic object types:

```typespec
union SearchResult {
  User,
  string, // scalar - will be wrapped
}
```

Emits:

```graphql
type SearchResultStringUnionVariant {
  value: String!
}

union SearchResult = User | SearchResultStringUnionVariant
```

For unions used as input parameters, the emitter generates a `@oneOf` input type since GraphQL unions are output-only.
