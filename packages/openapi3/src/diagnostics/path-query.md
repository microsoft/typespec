This diagnostic is issued when the OpenAPI emitter finds an `@route` decorator that specifies a path that contains a query parameter. This is not permitted by the OpenAPI v3 specification, which requires query parameters to be defined separately.

To fix this issue, redesign the API to only use paths without query parameters, and define query parameters using the `@query` decorator.

### Example

Instead of:

```typespec
@route("/users?filter={filter}")
op getUsers(filter: string): User[];
```

Use:

```typespec
@route("/users")
op getUsers(@query filter?: string): User[];
```

Alternatively, you can leverage TypeSpec's support for URI templates:

```typespec
@route("/users{?filter}")
op getUsers(filter?: string): User[];
```
