---
title: Diagnostics
---

The OpenAPI emitter may produce any of the following diagnostic messages.

<!-- Topics within this section should be ordered alphabetically for easy lookup -->

## duplicate-header

This diagnostic is issued when a response header is defined more than once for a response of a specific status code.

To fix this issue, ensure that each response header is defined only once for each status code.

### Example

```yaml
responses:
  "200":
    description: Successful response
    headers:
      X-Rate-Limit:
        description: The number of allowed requests in the current period
        schema:
          type: integer
      X-Rate-Limit:
        description: The number of allowed requests in the current period
        schema:
          type: integer
```

In this example, the `X-Rate-Limit` header is defined twice for the `200` status code. To fix this issue, remove the duplicate header definition.

## duplicate-type-name

This diagnostic is issued when a schema or parameter name is a duplicate of another schema or parameter. This generally happens when a model or parameter is renamed with the `@friendlyName` decorator, resulting in two different TypeSpec types getting the same name in the OpenAPI output.

To fix this issue, change the name or friendly-name of one of the models or parameters.

### Example

```typespec
@friendlyName("User")
model Customer {
  id: string;
}

model User {
  id: string;
}
```

In this example, both `Customer` and `User` would appear as `User` in the OpenAPI output, causing a conflict.

## inline-cycle

This diagnostic is issued when a cyclic reference is detected within inline schemas.

To fix this issue, refactor the schemas to remove the cyclic reference.

### Example

```yaml
components:
  schemas:
    Node:
      type: object
      properties:
        value:
          type: string
        next:
          $ref: "#/components/schemas/Node"
```

In this example, the `Node` schema references itself, creating a cyclic reference. To fix this issue, refactor the schema to remove the cyclic reference.

## invalid-default

This diagnostic is issued when a default value is invalid for the specified schema type.

To fix this issue, ensure that the default value is valid for the schema type.

### Example

```yaml
components:
  schemas:
    User:
      type: object
      properties:
        age:
          type: integer
          default: "twenty"
```

In this example, the `default` value for the `age` property is invalid because it is a string instead of an integer. To fix this issue, provide a valid default value, such as `20`.

## invalid-extension-key

This diagnostic is issued by the `@extension` decorator when the extension key does not start with "x-" as
required by the OpenAPI v3 specification.

To fix this issue, change the extension name to start with "x-".

### Example

```typespec
@extension("invalid-name", "value")
model User {
  id: string;
}
```

Should be changed to:

```typespec
@extension("x-valid-name", "value")
model User {
  id: string;
}
```

## invalid-schema

This diagnostic is issued when a schema is invalid according to the OpenAPI v3 specification.

To fix this issue, review your TypeSpec definitions to ensure they map to valid OpenAPI schemas.

### Example

```yaml
components:
  schemas:
    User:
      type: object
      properties:
        id:
          type: string
        age:
          type: integer
          format: "int" # Invalid format
```

In this example, the `format` value for the `age` property is invalid. To fix this issue, provide a valid format value such as `int32` or `int64`.

## invalid-server-variable

This diagnostic is issued when a variable in the `@server` decorator is not defined as a string type.
Since server variables are substituted into the server URL which is a string, all variables must have string values.

To fix this issue, make sure all server variables are of a type that is assignable to `string`.

### Example

```typespec
@server("{protocol}://{host}/api/{version}", "Custom endpoint", {
  protocol: "http" | "https",
  host: string,
  version: 1, // Should be a string: "1"
})
```

## path-query

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

## union-null

This diagnostic is issued when the result of model composition is effectively a `null` schema which cannot be
represented in OpenAPI.

To fix this issue, review your model compositions to ensure they produce valid schemas with actual properties or types.

## union-unsupported

This diagnostic is issued when the OpenAPI emitter finds a union of two incompatible types that cannot be represented in OpenAPI. OpenAPI has limited support for union types, and some combinations cannot be expressed.

To fix this issue, consider restructuring your types to avoid incompatible unions, or split the operation into multiple operations with different return types.
