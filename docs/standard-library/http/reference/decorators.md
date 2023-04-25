---
title: "Decorators"
toc_min_heading_level: 2
toc_max_heading_level: 3
---

# Decorators

## TypeSpec.Http

### `@body` {#@TypeSpec.Http.body}

Explicitly specify that this property is to be set as the body

```typespec
dec TypeSpec.Http.body(target: ModelProperty)
```

#### Target

`ModelProperty`

#### Parameters

None

#### Examples

```typespec
op upload(@body image: bytes): void;
op download(): {@body image: bytes};
```

### `@delete` {#@TypeSpec.Http.delete}

Specify the http verb for the target operation to be `DELETE`.

```typespec
dec TypeSpec.Http.delete(target: Operation)
```

#### Target

`Operation`

#### Parameters

None

#### Examples

```typespec
@delete op set(petId: string): void
```

### `@get` {#@TypeSpec.Http.get}

Specify the http verb for the target operation to be `GET`.

```typespec
dec TypeSpec.Http.get(target: Operation)
```

#### Target

`Operation`

#### Parameters

None

#### Examples

```typespec
@get op read(): string
```

### `@head` {#@TypeSpec.Http.head}

Specify the http verb for the target operation to be `HEAD`.

```typespec
dec TypeSpec.Http.head(target: Operation)
```

#### Target

`Operation`

#### Parameters

None

#### Examples

```typespec
@head op ping(petId: string): void
```

### `@header` {#@TypeSpec.Http.header}

Specify this property is to be sent or received as an http header.

```typespec
dec TypeSpec.Http.header(target: ModelProperty, headerNameOrOptions?: string | TypeSpec.Http.HeaderOptions)
```

#### Target

`ModelProperty`

#### Parameters

| Name                | Type                                          | Description                                                        |
| ------------------- | --------------------------------------------- | ------------------------------------------------------------------ |
| headerNameOrOptions | `union string \| TypeSpec.Http.HeaderOptions` | Optional name of the header when sent over http or header options. |

### `@includeInapplicableMetadataInPayload` {#@TypeSpec.Http.includeInapplicableMetadataInPayload}

Specify if inapplicable metadata should be included in the payload for the given entity.

```typespec
dec TypeSpec.Http.includeInapplicableMetadataInPayload(target: unknown, value: boolean)
```

#### Target

`(intrinsic) unknown`

#### Parameters

| Name  | Type             | Description |
| ----- | ---------------- | ----------- |
| value | `scalar boolean` |             |

### `@patch` {#@TypeSpec.Http.patch}

Specify the http verb for the target operation to be `PATCH`.

```typespec
dec TypeSpec.Http.patch(target: Operation)
```

#### Target

`Operation`

#### Parameters

None

#### Examples

```typespec
@patch op update(pet: Pet): void
```

### `@path` {#@TypeSpec.Http.path}

Explicitly specify that this property is to be interpolated as a path parameter.

```typespec
dec TypeSpec.Http.path(target: ModelProperty, paramName?: string)
```

#### Target

`ModelProperty`

#### Parameters

| Name      | Type            | Description                                         |
| --------- | --------------- | --------------------------------------------------- |
| paramName | `scalar string` | Optional name of the parameter in the url template. |

### `@post` {#@TypeSpec.Http.post}

Specify the http verb for the target operation to be `POST`.

```typespec
dec TypeSpec.Http.post(target: Operation)
```

#### Target

`Operation`

#### Parameters

None

#### Examples

```typespec
@post op create(pet: Pet): void
```

### `@put` {#@TypeSpec.Http.put}

Specify the http verb for the target operation to be `PUT`.

```typespec
dec TypeSpec.Http.put(target: Operation)
```

#### Target

`Operation`

#### Parameters

None

#### Examples

```typespec
@put op set(pet: Pet): void
```

### `@query` {#@TypeSpec.Http.query}

Specify this property is to be sent as a query parameter.

```typespec
dec TypeSpec.Http.query(target: ModelProperty, queryNameOrOptions?: string | TypeSpec.Http.QueryOptions)
```

#### Target

`ModelProperty`

#### Parameters

| Name               | Type                                         | Description                                                                     |
| ------------------ | -------------------------------------------- | ------------------------------------------------------------------------------- |
| queryNameOrOptions | `union string \| TypeSpec.Http.QueryOptions` | Optional name of the query when included in the url or query parameter options. |

### `@route` {#@TypeSpec.Http.route}

Defines the relative route URI for the target operation

The first argument should be a URI fragment that may contain one or more path parameter fields.
If the namespace or interface that contains the operation is also marked with a `@route` decorator,
it will be used as a prefix to the route URI of the operation.

`@route` can only be applied to operations, namespaces, and interfaces.

```typespec
dec TypeSpec.Http.route(target: Namespace | Interface | Operation, path: string, options?: (anonymous model))
```

#### Target

`union Namespace | Interface | Operation`

#### Parameters

| Name    | Type                      | Description                                           |
| ------- | ------------------------- | ----------------------------------------------------- |
| path    | `scalar string`           | Relative route path. Cannot include query parameters. |
| options | `model (anonymous model)` |                                                       |

### `@server` {#@TypeSpec.Http.server}

Specify the endpoint for this service.

```typespec
dec TypeSpec.Http.server(target: Namespace, url: string, description: string, parameters?: Record<unknown>)
```

#### Target

`Namespace`

#### Parameters

| Name        | Type                    | Description                                             |
| ----------- | ----------------------- | ------------------------------------------------------- |
| url         | `scalar string`         | Server endpoint                                         |
| description | `scalar string`         | Description of the endpoint                             |
| parameters  | `model Record<unknown>` | Optional set of parameters used to interpolate the url. |

### `@sharedRoute` {#@TypeSpec.Http.sharedRoute}

`@sharedRoute` marks the operation as sharing a route path with other operations.

When an operation is marked with `@sharedRoute`, it enables other operations to share the same
route path as long as those operations are also marked with `@sharedRoute`.

`@sharedRoute` can only be applied directly to operations.

```typespec
@sharedRoute
@route("/widgets")
op getWidget(@path id: string): Widget;
```

```typespec
dec TypeSpec.Http.sharedRoute(target: Operation)
```

#### Target

`Operation`

#### Parameters

None

### `@statusCode` {#@TypeSpec.Http.statusCode}

Specify the status code for this response. Property type must be a status code integer or a union of status code integer.

```typespec
dec TypeSpec.Http.statusCode(target: ModelProperty)
```

#### Target

`ModelProperty`

#### Parameters

None

#### Examples

```typespec
op read(): {@statusCode: 200, @body pet: Pet}
op create(): {@statusCode: 201 | 202}
```

### `@useAuth` {#@TypeSpec.Http.useAuth}

Specify this service authentication. See the [documentation in the Http library][https://microsoft.github.io/typespec/standard-library/rest/authentication] for full details.

```typespec
dec TypeSpec.Http.useAuth(target: Namespace, auth: {} | Union | {}[])
```

#### Target

`Namespace`

#### Parameters

| Name | Type                        | Description                                                                                                                                                    |
| ---- | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| auth | `union {} \| Union \| {}[]` | Authentication configuration. Can be a single security scheme, a union(either option is valid authentication) or a tuple(Must use all authentication together) |
