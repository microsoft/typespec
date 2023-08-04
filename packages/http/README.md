# @typespec/http

TypeSpec HTTP protocol binding

## Install

```bash
npm install @typespec/http
```

## Decorators

### TypeSpec.Http

- [`@body`](#@body)
- [`@delete`](#@delete)
- [`@get`](#@get)
- [`@head`](#@head)
- [`@header`](#@header)
- [`@includeInapplicableMetadataInPayload`](#@includeinapplicablemetadatainpayload)
- [`@patch`](#@patch)
- [`@path`](#@path)
- [`@post`](#@post)
- [`@put`](#@put)
- [`@query`](#@query)
- [`@route`](#@route)
- [`@server`](#@server)
- [`@sharedRoute`](#@sharedroute)
- [`@statusCode`](#@statuscode)
- [`@useAuth`](#@useauth)

#### `@body`

Explicitly specify that this property is to be set as the body

```typespec
@TypeSpec.Http.body
```

##### Target

`ModelProperty`

##### Parameters

None

##### Examples

```typespec
op upload(@body image: bytes): void;
op download(): {
  @body image: bytes;
};
```

#### `@delete`

Specify the HTTP verb for the target operation to be `DELETE`.

```typespec
@TypeSpec.Http.delete
```

##### Target

`Operation`

##### Parameters

None

##### Examples

```typespec
@delete op set(petId: string): void;
```

#### `@get`

Specify the HTTP verb for the target operation to be `GET`.

```typespec
@TypeSpec.Http.get
```

##### Target

`Operation`

##### Parameters

None

##### Examples

```typespec
@get op read(): string;
```

#### `@head`

Specify the HTTP verb for the target operation to be `HEAD`.

```typespec
@TypeSpec.Http.head
```

##### Target

`Operation`

##### Parameters

None

##### Examples

```typespec
@head op ping(petId: string): void;
```

#### `@header`

Specify this property is to be sent or received as an HTTP header.

```typespec
@TypeSpec.Http.header(headerNameOrOptions?: string | TypeSpec.Http.HeaderOptions)
```

##### Target

`ModelProperty`

##### Parameters

| Name                | Type                                          | Description                                                                                                                                                                                                 |
| ------------------- | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| headerNameOrOptions | `union string \| TypeSpec.Http.HeaderOptions` | Optional name of the header when sent over HTTP or header options.<br />By default the header name will be the property name converted from camelCase to kebab-case. (e.g. `contentType` -> `content-type`) |

##### Examples

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

###### Implicit header name

```typespec
op read(): {
  @header contentType: string;
}; // headerName: content-type
op update(@header ifMatch: string): void; // headerName: if-match
```

#### `@includeInapplicableMetadataInPayload`

Specify if inapplicable metadata should be included in the payload for the given entity.

```typespec
@TypeSpec.Http.includeInapplicableMetadataInPayload(value: valueof boolean)
```

##### Target

`(intrinsic) unknown`

##### Parameters

| Name  | Type                     | Description                                                     |
| ----- | ------------------------ | --------------------------------------------------------------- |
| value | `valueof scalar boolean` | If true, inapplicable metadata will be included in the payload. |

#### `@patch`

Specify the HTTP verb for the target operation to be `PATCH`.

```typespec
@TypeSpec.Http.patch
```

##### Target

`Operation`

##### Parameters

None

##### Examples

```typespec
@patch op update(pet: Pet): void;
```

#### `@path`

Explicitly specify that this property is to be interpolated as a path parameter.

```typespec
@TypeSpec.Http.path(paramName?: valueof string)
```

##### Target

`ModelProperty`

##### Parameters

| Name      | Type                    | Description                                         |
| --------- | ----------------------- | --------------------------------------------------- |
| paramName | `valueof scalar string` | Optional name of the parameter in the url template. |

##### Examples

```typespec
@route("/read/{explicit}/things/{implicit}")
op read(@path explicit: string, implicit: string): void;
```

#### `@post`

Specify the HTTP verb for the target operation to be `POST`.

```typespec
@TypeSpec.Http.post
```

##### Target

`Operation`

##### Parameters

None

##### Examples

```typespec
@post op create(pet: Pet): void;
```

#### `@put`

Specify the HTTP verb for the target operation to be `PUT`.

```typespec
@TypeSpec.Http.put
```

##### Target

`Operation`

##### Parameters

None

##### Examples

```typespec
@put op set(pet: Pet): void;
```

#### `@query`

Specify this property is to be sent as a query parameter.

```typespec
@TypeSpec.Http.query(queryNameOrOptions?: string | TypeSpec.Http.QueryOptions)
```

##### Target

`ModelProperty`

##### Parameters

| Name               | Type                                         | Description                                                                     |
| ------------------ | -------------------------------------------- | ------------------------------------------------------------------------------- |
| queryNameOrOptions | `union string \| TypeSpec.Http.QueryOptions` | Optional name of the query when included in the url or query parameter options. |

##### Examples

```typespec
op read(@query select: string, @query("order-by") orderBy: string): void;
op list(
  @query({
    name: "id",
    format: "multi",
  })
  ids: string[],
): void;
```

#### `@route`

Defines the relative route URI for the target operation

The first argument should be a URI fragment that may contain one or more path parameter fields.
If the namespace or interface that contains the operation is also marked with a `@route` decorator,
it will be used as a prefix to the route URI of the operation.

`@route` can only be applied to operations, namespaces, and interfaces.

```typespec
@TypeSpec.Http.route(path: valueof string, options?: (anonymous model))
```

##### Target

`union Namespace | Interface | Operation`

##### Parameters

| Name    | Type                      | Description                                                                                                                                  |
| ------- | ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| path    | `valueof scalar string`   | Relative route path. Cannot include query parameters.                                                                                        |
| options | `model (anonymous model)` | Set of parameters used to configure the route. Supports `{shared: true}` which indicates that the route may be shared by several operations. |

##### Examples

```typespec
@route("/widgets")
op getWidget(@path id: string): Widget;
```

#### `@server`

Specify the endpoint for this service.

```typespec
@TypeSpec.Http.server(url: valueof string, description: valueof string, parameters?: Record<unknown>)
```

##### Target

`Namespace`

##### Parameters

| Name        | Type                    | Description                                             |
| ----------- | ----------------------- | ------------------------------------------------------- |
| url         | `valueof scalar string` | Server endpoint                                         |
| description | `valueof scalar string` | Description of the endpoint                             |
| parameters  | `model Record<unknown>` | Optional set of parameters used to interpolate the url. |

##### Examples

```typespec
@service
@server("https://example.com", "Single server endpoint")
namespace PetStore;
```

###### parameterized

```typespec
@server("https://{region}.foo.com", "Regional endpoint", {
@doc("Region name")
region?: string = "westus",
})
```

#### `@sharedRoute`

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

##### Target

`Operation`

##### Parameters

None

#### `@statusCode`

Specify the status code for this response. Property type must be a status code integer or a union of status code integer.

```typespec
@TypeSpec.Http.statusCode
```

##### Target

`ModelProperty`

##### Parameters

None

##### Examples

```typespec
op read(): {@statusCode: 200, @body pet: Pet}
op create(): {@statusCode: 201 | 202}
```

#### `@useAuth`

Specify this service authentication. See the [documentation in the Http library][https://microsoft.github.io/typespec/standard-library/rest/authentication] for full details.

```typespec
@TypeSpec.Http.useAuth(auth: {} | Union | {}[])
```

##### Target

`Namespace`

##### Parameters

| Name | Type                        | Description                                                                                                                                                    |
| ---- | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| auth | `union {} \| Union \| {}[]` | Authentication configuration. Can be a single security scheme, a union(either option is valid authentication) or a tuple(Must use all authentication together) |

##### Examples

```typespec
@service
@useAuth(BasicAuth)
namespace PetStore;
```
