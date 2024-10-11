---
title: OpenAPI3 to TypeSpec
---

:::warning
The OpenAPI3 to TypeSpec conversion purpose is a one time conversion to help you get started with TypeSpec.
The output can change in future versions of TypeSpec without being considered a breaking change.
:::

## Converting OpenAPI 3 into TypeSpec

This package includes the `tsp-openapi3` CLI for converting OpenAPI 3 specs into TypeSpec.
The generated TypeSpec depends on the `@typespec/http`, `@typespec/openapi` and `@typespec/openapi3` libraries.

### Usage

1. via the command line

```bash
tsp-openapi3 ./openapi3spec.yml --output-dir ./tsp-output
```

### tsp-openapi3 arguments

The path to the OpenAPI3 yaml or json file **must** be passed as a position argument.

The named arguments are:

| Name       | Type    | Required | Description                                                                              |
| ---------- | ------- | -------- | ---------------------------------------------------------------------------------------- |
| output-dir | string  | required | The output directory for generated TypeSpec files. Will be created if it does not exist. |
| help       | boolean | optional | Show help.                                                                               |

## Examples

### 1. Convert component schemas into models

All schemas present at `#/components/schemas` will be converted into a model or scalar as appropriate.

<table>
<tr>
<td>OpenAPI3</td>
<td>TypeSpec</td>
</tr>
<!-- ---------------------------------------------------  SCENARIO 1.1  ----------------------------------------------------------- -->
<tr>
<td>

```yml
components:
  schemas:
    Widget:
      type: object
      required:
        - id
        - weight
        - color
      properties:
        id:
          type: string
        weight:
          type: integer
          format: int32
        color:
          type: string
          enum:
            - red
            - blue
    uuid:
      type: string
      format: uuid
```

</td>
<td>

```tsp
model Widget {
  id: string;
  weight: int32;
  color: "red" | "blue";
}

@format("uuid")
scalar uuid extends string;
```

</td>
</tr>
</table>

### 2. Convert component parameters into models or fields

All parameters present at `#/components/parameters` will be converted to a field in a model. If the model doesn't exist in `#/components/schemas`, then it will be created.

<table>
<tr>
  <td>OpenAPI3</td>
  <td>TypeSpec</td>
</tr>
<!-- ---------------------------------------------------  SCENARIO 2.1  ----------------------------------------------------------- -->
<tr>
<td>

```yml
components:
  parameters:
    Widget.id:
      name: id
      in: path
      required: true
      schema:
        type: string
  schemas:
    Widget:
      type: object
      required:
        - id
        - weight
        - color
      properties:
        id:
          type: string
        weight:
          type: integer
          format: int32
        color:
          type: string
          enum:
            - red
            - blue
```

</td>
<td>

```tsp
model Widget {
  @path id: string;
  weight: int32;
  color: "red" | "blue";
}
```

</td>
</tr>
<!-- ---------------------------------------------------  SCENARIO 2.2  ----------------------------------------------------------- -->
<tr>
<td>

```yml
components:
  parameters:
    Foo.id:
      name: id
      in: path
      required: true
      schema:
        type: string
```

</td>
<td>

```tsp
model Foo {
  @path id: string;
}
```

</td>
</tr>
</table>

### 3. Convert path routes to operations

All routes using one of the HTTP methods supported by `@typespec/http` will be converted into operations at the file namespace level. A model is also generated for each operation response.

At this time, no automatic operation grouping under interfaces is performed.

<table>
<tr>
  <td>OpenAPI3</td>
  <td>TypeSpec</td>
</tr>
<!-- ---------------------------------------------------  SCENARIO 3.1  ----------------------------------------------------------- -->
<tr>
<td>

```yml
paths:
  /{id}:
    get:
      operationId: readWidget
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        "200":
          description: The request has succeeded.
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Widget"
```

</td>
<td>

```tsp
/**
 * The request has succeeded.
 */
model readWidget200ApplicationJsonResponse {
  @statusCode statusCode: 200;
  @bodyRoot body: Widget;
}

@route("/{id}") @get op readWidget(@path id: string): readWidget200ApplicationJsonResponse;
```

</td>
</tr>
</table>
