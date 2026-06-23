---
title: "Decorators"
description: "Decorators exported by @typespec/graphql"
toc_min_heading_level: 2
toc_max_heading_level: 3
---

## TypeSpec.GraphQL

### `@compose` {#@TypeSpec.GraphQL.compose}

Specify the GraphQL interfaces that should be implemented by a model.
The interfaces must be decorated with the

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

````typespec
@compose(Influencer, Person)
model User {
 ... Influencer;
 ... Person;
}


### `@interface` {#@TypeSpec.GraphQL.interface}

Mark this model as a GraphQL Interface. Interfaces can be implemented by other models.
```typespec
@TypeSpec.GraphQL.interface(options?: valueof { interfaceOnly: boolean })
````

#### Target

`Model`

#### Parameters

| Name    | Type            | Description |
| ------- | --------------- | ----------- |
| options | `valueof {...}` |             |

#### Examples

```typespec
@`interface`(#{ interfaceOnly: true })
model Node {
  id: string;
}

@`interface`
model Person {
  name: string;
}
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
@mutation op update(): string;
```

### `@nullable` {#@TypeSpec.GraphQL.nullable}

Mark a field, operation, or type as nullable in the emitted GraphQL schema.

Applied automatically by the mutation engine when it strips `| null` from
union types. The decorator's presence on the type's `decorators` array is
the signal — the implementation is a no-op.

```typespec
@TypeSpec.GraphQL.nullable
```

#### Target

`ModelProperty | Operation | Union | Model`

#### Parameters

None

### `@nullableElements` {#@TypeSpec.GraphQL.nullableElements}

Mark a field or operation as having nullable array elements in the emitted GraphQL schema.

Applied automatically by the mutation engine when it detects `Array<T | null>`
patterns. Causes the emitter to emit `[T]` instead of `[T!]`.

```typespec
@TypeSpec.GraphQL.nullableElements
```

#### Target

`ModelProperty | Operation`

#### Parameters

None

### `@oneOf` {#@TypeSpec.GraphQL.oneOf}

Mark a model as a `@oneOf` input object in the emitted GraphQL schema.

This decorator is applied automatically by the mutation engine when it converts
a union type in input context to a synthetic input object (since GraphQL unions
are output-only). The emitter uses this to emit the `@oneOf` directive.

```typespec
@TypeSpec.GraphQL.oneOf
```

#### Target

`Model`

#### Parameters

None

### `@operationFields` {#@TypeSpec.GraphQL.operationFields}

Assign one or more operations or interfaces to act as fields with arguments on a model.

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

````typespec
op followers(query: string): Person[];

@operationFields(followers)
model Person {}


### `@query` {#@TypeSpec.GraphQL.query}

Specify the GraphQL Operation kind for the target operation to be `QUERY`.
```typespec
@TypeSpec.GraphQL.query
````

#### Target

`Operation`

#### Parameters

None

#### Examples

```typespec
@query op read(): string;
```

### `@schema` {#@TypeSpec.GraphQL.schema}

Mark this namespace as describing a GraphQL schema and configure schema properties.

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
@schema(#{ name: "MySchema" })
namespace MySchema {

}
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
@specifiedBy("https://scalars.graphql.org/jakobmerrild/long.html")
scalar Long extends int64;
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
@subscription op get_periodically(): string;
```
