---
title: "Decorators"
toc_min_heading_level: 2
toc_max_heading_level: 3
---

# Decorators

## TypeSpec.Http

### `@body` {#@TypeSpec.Http.body}

Explicitly specify that this property type will be exactly the HTTP body.

This means that any properties under `@body` cannot be marked as headers, query parameters, or path parameters.
If wanting to change the resolution of the body but still mix parameters, use `@bodyRoot`.

```typespec
@TypeSpec.Http.body
```

#### Target

`ModelProperty`

#### Parameters

None

#### Examples

```typespec
op upload(@body image: bytes): void;
op download(): {
  @body image: bytes;
};
```

### `@bodyIgnore` {#@TypeSpec.Http.bodyIgnore}

Specify that this property shouldn't be included in the HTTP body.
This can be useful when bundling metadata together that would result in an empty property to be included in the body.

```typespec
@TypeSpec.Http.bodyIgnore
```

#### Target

`ModelProperty`

#### Parameters

None

#### Examples

```typespec
op upload(
  name: string,
  @bodyIgnore headers: {
    @header id: string;
  },
): void;
```

### `@bodyRoot` {#@TypeSpec.Http.bodyRoot}

Specify that the body resolution should be resolved from that property.
By default the body is resolved by including all properties in the operation request/response that are not metadata.
This allows to nest the body in a property while still allowing to use headers, query parameters, and path parameters in the same model.

```typespec
@TypeSpec.Http.bodyRoot
```

#### Target

`ModelProperty`

#### Parameters

None

#### Examples

```typespec
op upload(
  @bodyRoot user: {
    name: string;
    @header id: string;
  },
): void;
op download(): {
  @bodyRoot user: {
    name: string;
    @header id: string;
  };
};
```

### `@delete` {#@TypeSpec.Http.delete}

Specify the HTTP verb for the target operation to be `DELETE`.

```typespec
@TypeSpec.Http.delete
```

#### Target

`Operation`

#### Parameters

None

#### Examples

```typespec
@delete op set(petId: string): void;
```

### `@get` {#@TypeSpec.Http.get}

Specify the HTTP verb for the target operation to be `GET`.

```typespec
@TypeSpec.Http.get
```

#### Target

`Operation`

#### Parameters

None

#### Examples

```typespec
@get op read(): string;
```

### `@head` {#@TypeSpec.Http.head}

Specify the HTTP verb for the target operation to be `HEAD`.

```typespec
@TypeSpec.Http.head
```

#### Target

`Operation`

#### Parameters

None

#### Examples

```typespec
@head op ping(petId: string): void;
```

### `@header` {#@TypeSpec.Http.header}

Specify this property is to be sent or received as an HTTP header.

```typespec
@TypeSpec.Http.header(headerNameOrOptions?: string | TypeSpec.Http.HeaderOptions)
```

#### Target

`ModelProperty`

#### Parameters

| Name                | Type                                    | Description                                                                                                                                                                                                 |
| ------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| headerNameOrOptions | `string \| TypeSpec.Http.HeaderOptions` | Optional name of the header when sent over HTTP or header options.<br />By default the header name will be the property name converted from camelCase to kebab-case. (e.g. `contentType` -> `content-type`) |

#### Examples

```typespec
op read(@header accept: string): {
  @header("ETag") eTag: string;
};
op create(
  @header({
    name: "X-Color",
    format: "csv",
  })
  colors: string[],
): void;
```

##### Implicit header name

```typespec
op read(): {
  @header contentType: string;
}; // headerName: content-type
op update(@header ifMatch: string): void; // headerName: if-match
```

### `@includeInapplicableMetadataInPayload` {#@TypeSpec.Http.includeInapplicableMetadataInPayload}

Specify if inapplicable metadata should be included in the payload for the given entity.

```typespec
@TypeSpec.Http.includeInapplicableMetadataInPayload(value: valueof boolean)
```

#### Target

`unknown`

#### Parameters

| Name  | Type              | Description                                                     |
| ----- | ----------------- | --------------------------------------------------------------- |
| value | `valueof boolean` | If true, inapplicable metadata will be included in the payload. |

### `@multipartBody` {#@TypeSpec.Http.multipartBody}

```typespec
@TypeSpec.Http.multipartBody
```

#### Target

`ModelProperty`

#### Parameters

None

#### Examples

```tsp
op upload(
  @header `content-type`: "multipart/form-data",
  @multipartBody body: {
    fullName: HttpPart<string>;
    headShots: HttpPart<Image>[];
  },
): void;
```

### `@patch` {#@TypeSpec.Http.patch}

Specify the HTTP verb for the target operation to be `PATCH`.

```typespec
@TypeSpec.Http.patch
```

#### Target

`Operation`

#### Parameters

None

#### Examples

```typespec
@patch op update(pet: Pet): void;
```

### `@path` {#@TypeSpec.Http.path}

Explicitly specify that this property is to be interpolated as a path parameter.

```typespec
@TypeSpec.Http.path(paramNameOrOptions?: valueof string | TypeSpec.Http.PathOptions)
```

#### Target

`ModelProperty`

#### Parameters

| Name               | Type                                          | Description                                                    |
| ------------------ | --------------------------------------------- | -------------------------------------------------------------- |
| paramNameOrOptions | `valueof string \| TypeSpec.Http.PathOptions` | Optional name of the parameter in the uri template or options. |

#### Examples

```typespec
@route("/read/{explicit}/things/{implicit}")
op read(@path explicit: string, implicit: string): void;
```

### `@post` {#@TypeSpec.Http.post}

Specify the HTTP verb for the target operation to be `POST`.

```typespec
@TypeSpec.Http.post
```

#### Target

`Operation`

#### Parameters

None

#### Examples

```typespec
@post op create(pet: Pet): void;
```

### `@put` {#@TypeSpec.Http.put}

Specify the HTTP verb for the target operation to be `PUT`.

```typespec
@TypeSpec.Http.put
```

#### Target

`Operation`

#### Parameters

None

#### Examples

```typespec
@put op set(pet: Pet): void;
```

### `@query` {#@TypeSpec.Http.query}

Specify this property is to be sent as a query parameter.

```typespec
@TypeSpec.Http.query(queryNameOrOptions?: valueof string | TypeSpec.Http.QueryOptions)
```

#### Target

`ModelProperty`

#### Parameters

| Name               | Type                                           | Description                                                                     |
| ------------------ | ---------------------------------------------- | ------------------------------------------------------------------------------- |
| queryNameOrOptions | `valueof string \| TypeSpec.Http.QueryOptions` | Optional name of the query when included in the url or query parameter options. |

#### Examples

```typespec
op read(@query select: string, @query("order-by") orderBy: string): void;
op list(@query(#{ name: "id", explode: true }) ids: string[]): void;
```

### `@route` {#@TypeSpec.Http.route}

Defines the relative route URI template for the target operation as defined by [RFC 6570](https://datatracker.ietf.org/doc/html/rfc6570#section-3.2.3)

`@route` can only be applied to operations, namespaces, and interfaces.

```typespec
@TypeSpec.Http.route(path: valueof string, options?: { shared: boolean })
```

#### Target

`Namespace | Interface | Operation`

#### Parameters

| Name    | Type             | Description                                                                                                                                               |
| ------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| path    | `valueof string` |                                                                                                                                                           |
| options | `{...}`          | _DEPRECATED_ Set of parameters used to configure the route. Supports `{shared: true}` which indicates that the route may be shared by several operations. |

#### Examples

##### Simple path parameter

```typespec
@route("/widgets/{id}") op getWidget(@path id: string): Widget;
```

##### Reserved characters

```typespec
@route("/files{+path}") op getFile(@path path: string): bytes;
```

##### Query parameter

```typespec
@route("/files") op list(select?: string, filter?: string): Files[];
@route("/files{?select,filter}") op listFullUriTemplate(select?: string, filter?: string): Files[];
```

### `@server` {#@TypeSpec.Http.server}

Specify an endpoint for this service. Multiple `@server` decorators can be used to specify multiple endpoints.

```typespec
@TypeSpec.Http.server(url: valueof string, description: valueof string, parameters?: Record<unknown>)
```

#### Target

`Namespace`

#### Parameters

| Name        | Type              | Description                                             |
| ----------- | ----------------- | ------------------------------------------------------- |
| url         | `valueof string`  | Server endpoint                                         |
| description | `valueof string`  | Description of the endpoint                             |
| parameters  | `Record<unknown>` | Optional set of parameters used to interpolate the url. |

#### Examples

```typespec
@service
@server("https://example.com", "Single server endpoint")
namespace PetStore;
```

##### Parameterized

```typespec
@server("https://{region}.foo.com", "Regional endpoint", {
  @doc("Region name")
  region?: string = "westus",
})
```

##### Multiple

```typespec
@service
@server("https://example.com", "Standard endpoint")
@server(
  "https://{project}.private.example.com",
  "Private project endpoint",
  {
    project: string,
  }
)
namespace PetStore;
```

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
@TypeSpec.Http.sharedRoute
```

#### Target

`Operation`

#### Parameters

None

### `@statusCode` {#@TypeSpec.Http.statusCode}

Specify the status code for this response. Property type must be a status code integer or a union of status code integer.

```typespec
@TypeSpec.Http.statusCode
```

#### Target

`ModelProperty`

#### Parameters

None

#### Examples

```typespec
op read(): {
  @statusCode _: 200;
  @body pet: Pet;
};
op create(): {
  @statusCode _: 201 | 202;
};
```

### `@useAuth` {#@TypeSpec.Http.useAuth}

Specify authentication for a whole service or specific methods. See the [documentation in the Http library](https://typespec.io/docs/libraries/http/authentication) for full details.

```typespec
@TypeSpec.Http.useAuth(auth: {} | Union | {}[])
```

#### Target

`Namespace | Interface | Operation`

#### Parameters

| Name | Type                  | Description                                                                                                                                                     |
| ---- | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| auth | `{} \| Union \| {}[]` | Authentication configuration. Can be a single security scheme, a union(either option is valid authentication) or a tuple (must use all authentication together) |

#### Examples

```typespec
@service
@useAuth(BasicAuth)
namespace PetStore;
```
