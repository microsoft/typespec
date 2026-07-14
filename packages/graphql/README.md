# @typespec/graphql

TypeSpec library for emitting GraphQL

## Install

```bash
npm install @typespec/graphql
```

## Emitter usage

1. Via the command line

```bash
tsp compile . --emit=@typespec/graphql
```

2. Via the config

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
    option: value
```

## Emitter options

### `emitter-output-dir`

**Type:** `absolutePath`

Defines the emitter output directory. Defaults to `{output-dir}/@typespec/graphql`
See [Configuring output directory for more info](https://typespec.io/docs/handbook/configuration/configuration/#configuring-output-directory)

### `output-file`

**Type:** `string`

Name of the output file.
Output file will interpolate the following values:

- schema-name: Name of the schema if multiple

Default: `{schema-name}.graphql`

Example Single schema

- `schema.graphql`

Example Multiple schemas

- `Org1.Schema1.graphql`
- `Org1.Schema2.graphql`

### `new-line`

**Type:** `"crlf" | "lf"`

**Default:** `"lf"`

Set the newLine character for emitting files.

### `omit-unreachable-types`

**Type:** `boolean`

Omit unreachable types.
By default all types declared under the schema namespace will be included.
With this flag on only types references in an operation will be emitted.

## Decorators

### TypeSpec.GraphQL

- [`@compose`](#@compose)
- [`@graphqlInterface`](#@graphqlinterface)
- [`@mutation`](#@mutation)
- [`@operationFields`](#@operationfields)
- [`@query`](#@query)
- [`@schema`](#@schema)
- [`@specifiedBy`](#@specifiedby)
- [`@subscription`](#@subscription)

#### `@compose`

Specify the GraphQL interfaces that should be implemented by a model.
The interfaces must be decorated with the `@graphqlInterface` decorator,
and all of the interfaces' properties must be present and compatible.

```typespec
@TypeSpec.GraphQL.compose(...interfaces: Model[])
```

##### Target

`Model`

##### Parameters

| Name       | Type      | Description |
| ---------- | --------- | ----------- |
| interfaces | `Model[]` |             |

##### Examples

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

#### `@graphqlInterface`

Mark this model as a GraphQL Interface. Interfaces can be implemented by other models
using the `@compose` decorator.

```typespec
@TypeSpec.GraphQL.graphqlInterface(options?: valueof { interfaceOnly: boolean })
```

##### Target

`Model`

##### Parameters

| Name    | Type            | Description                                                                                                                                                                                                                                                           |
| ------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| options | `valueof {...}` | .interfaceOnly When true, the model will only be emitted as an interface<br />(no "Interface" suffix is added to the name). Use this for abstract interfaces that<br />will never be used directly as output/input types (e.g., Node, Connection). Defaults to false. |

##### Examples

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

#### `@mutation`

Specify the GraphQL Operation kind for the target operation to be `MUTATION`.

```typespec
@TypeSpec.GraphQL.mutation
```

##### Target

`Operation`

##### Parameters

None

##### Examples

```typespec
@mutation op createUser(name: string): User;
```

#### `@operationFields`

Assign one or more operations or interfaces to act as fields with arguments on a model.
The operations become fields on the GraphQL type with their parameters as arguments.

```typespec
@TypeSpec.GraphQL.operationFields(...operations: Operation | Interface[])
```

##### Target

`Model`

##### Parameters

| Name       | Type                       | Description |
| ---------- | -------------------------- | ----------- |
| operations | `Operation \| Interface[]` |             |

##### Examples

```typespec
op followers(query: string): Person[];

@operationFields(followers)
model Person {
  name: string;
}
// Emits: type Person { name: String!; followers(query: String!): [Person!]! }
```

#### `@query`

Specify the GraphQL Operation kind for the target operation to be `QUERY`.

```typespec
@TypeSpec.GraphQL.query
```

##### Target

`Operation`

##### Parameters

None

##### Examples

```typespec
@query op getUser(id: string): User;
```

#### `@schema`

Mark this namespace as describing a GraphQL schema and configure schema properties.
All types and operations within the namespace will be emitted to a single GraphQL schema file.

```typespec
@TypeSpec.GraphQL.schema(options?: valueof TypeSpec.GraphQL.Schema.SchemaOptions)
```

##### Target

`Namespace`

##### Parameters

| Name    | Type                                      | Description |
| ------- | ----------------------------------------- | ----------- |
| options | [valueof `SchemaOptions`](#schemaoptions) |             |

##### Examples

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

#### `@specifiedBy`

Provide a specification URL for a custom GraphQL scalar type.
This maps to the `@specifiedBy` directive in the emitted GraphQL schema.

```typespec
@TypeSpec.GraphQL.specifiedBy(url: valueof url)
```

##### Target

`Scalar`

##### Parameters

| Name | Type          | Description                          |
| ---- | ------------- | ------------------------------------ |
| url  | `valueof url` | URL to the scalar type specification |

##### Examples

```typespec
@specifiedBy("https://scalars.graphql.org/andimarek/date-time")
scalar DateTime extends utcDateTime;
```

#### `@subscription`

Specify the GraphQL Operation kind for the target operation to be `SUBSCRIPTION`.

```typespec
@TypeSpec.GraphQL.subscription
```

##### Target

`Operation`

##### Parameters

None

##### Examples

```typespec
@subscription op onUserCreated(): User;
```
