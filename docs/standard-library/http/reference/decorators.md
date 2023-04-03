---
title: "Decorators"
toc_min_heading_level: 2
toc_max_heading_level: 3
---

# Decorators

## Http

### `@statusCode` {#@Http.statusCode}

Specify the status code for this response. Property type must be a status code integer or a union of status code integer.

```typespec
dec Http.statusCode(target: ModelProperty)
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

### `@body` {#@Http.body}

Explicitly specify that this property is to be set as the body

```typespec
dec Http.body(target: ModelProperty)
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

### `@header` {#@Http.header}

Specify this property is to be sent or received as an http header.

```typespec
dec Http.header(target: ModelProperty, headerNameOrOptions?: string | TypeSpec.Http.HeaderOptions)
```

#### Target

`ModelProperty`

#### Parameters

| Name                | Type                                          | Description                                                        |
| ------------------- | --------------------------------------------- | ------------------------------------------------------------------ |
| headerNameOrOptions | `union string \| TypeSpec.Http.HeaderOptions` | Optional name of the header when sent over http or header options. |

### `@query` {#@Http.query}

Specify this property is to be sent as a query parameter.

```typespec
dec Http.query(target: ModelProperty, queryNameOrOptions?: string | TypeSpec.Http.QueryOptions)
```

#### Target

`ModelProperty`

#### Parameters

| Name               | Type                                         | Description                                                                     |
| ------------------ | -------------------------------------------- | ------------------------------------------------------------------------------- |
| queryNameOrOptions | `union string \| TypeSpec.Http.QueryOptions` | Optional name of the query when included in the url or query parameter options. |

### `@path` {#@Http.path}

Explicitly specify that this property is to be interpolated as a path parameter.

```typespec
dec Http.path(target: ModelProperty, paramName?: string)
```

#### Target

`ModelProperty`

#### Parameters

| Name      | Type            | Description                                         |
| --------- | --------------- | --------------------------------------------------- |
| paramName | `scalar string` | Optional name of the parameter in the url template. |

### `@get` {#@Http.get}

Specify the http verb for the target operation to be `GET`.

```typespec
dec Http.get(target: Operation)
```

#### Target

`Operation`

#### Parameters

None

#### Examples

```typespec
@get op read(): string
```

### `@put` {#@Http.put}

Specify the http verb for the target operation to be `PUT`.

```typespec
dec Http.put(target: Operation)
```

#### Target

`Operation`

#### Parameters

None

#### Examples

```typespec
@put op set(pet: Pet): void
```

### `@post` {#@Http.post}

Specify the http verb for the target operation to be `POST`.

```typespec
dec Http.post(target: Operation)
```

#### Target

`Operation`

#### Parameters

None

#### Examples

```typespec
@post op create(pet: Pet): void
```

### `@patch` {#@Http.patch}

Specify the http verb for the target operation to be `PATCH`.

```typespec
dec Http.patch(target: Operation)
```

#### Target

`Operation`

#### Parameters

None

#### Examples

```typespec
@patch op update(pet: Pet): void
```

### `@delete` {#@Http.delete}

Specify the http verb for the target operation to be `DELETE`.

```typespec
dec Http.delete(target: Operation)
```

#### Target

`Operation`

#### Parameters

None

#### Examples

```typespec
@delete op set(petId: string): void
```

### `@head` {#@Http.head}

Specify the http verb for the target operation to be `HEAD`.

```typespec
dec Http.head(target: Operation)
```

#### Target

`Operation`

#### Parameters

None

#### Examples

```typespec
@head op ping(petId: string): void
```

### `@server` {#@Http.server}

Specify the endpoint for this service.

```typespec
dec Http.server(target: Namespace, url: string, description: string, parameters?: object)
```

#### Target

`Namespace`

#### Parameters

| Name        | Type            | Description                                             |
| ----------- | --------------- | ------------------------------------------------------- |
| url         | `scalar string` | Description of the endpoint                             |
| description | `scalar string` |                                                         |
| parameters  | `model object`  | Optional set of parameters used to interpolate the url. |

### `@useAuth` {#@Http.useAuth}

Specify this service authentication. See the [documentation in the Http library][https://microsoft.github.io/typespec/standard-library/rest/authentication] for full details.

```typespec
dec Http.useAuth(target: Namespace, auth: object | Union | Array)
```

#### Target

`Namespace`

#### Parameters

| Name | Type                             | Description                                                                                                                                                    |
| ---- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| auth | `union object \| Union \| Array` | Authentication configuration. Can be a single security scheme, a union(either option is valid authentication) or a tuple(Must use all authentication together) |

### `@includeInapplicableMetadataInPayload` {#@Http.includeInapplicableMetadataInPayload}

Specify if inapplicable metadata should be included in the payload for the given entity.

```typespec
dec Http.includeInapplicableMetadataInPayload(target: unknown, value: boolean)
```

#### Target

`(intrinsic) unknown`

#### Parameters

| Name  | Type             | Description |
| ----- | ---------------- | ----------- |
| value | `scalar boolean` |             |
