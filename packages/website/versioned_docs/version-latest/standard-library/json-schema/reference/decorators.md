---
title: "Decorators"
toc_min_heading_level: 2
toc_max_heading_level: 3
---

# Decorators

## TypeSpec.JsonSchema

### `@baseUri` {#@TypeSpec.JsonSchema.baseUri}

Set the base URI for any schemas emitted from types within this namespace.

```typespec
@TypeSpec.JsonSchema.baseUri(baseUri: valueof string)
```

#### Target

`Namespace`

#### Parameters

| Name    | Type                    | Description                                                              |
| ------- | ----------------------- | ------------------------------------------------------------------------ |
| baseUri | `valueof scalar string` | the base URI. Schema IDs inside this namespace are relative to this URI. |

### `@contains` {#@TypeSpec.JsonSchema.contains}

Specify that the array must contain at least one instance of the provided type.
Use `@minContains` and `@maxContains` to customize how many instances to expect.

```typespec
@TypeSpec.JsonSchema.contains(value: unknown)
```

#### Target

`union unknown[] | ModelProperty`

#### Parameters

| Name  | Type                  | Description                      |
| ----- | --------------------- | -------------------------------- |
| value | `(intrinsic) unknown` | The type the array must contain. |

### `@contentEncoding` {#@TypeSpec.JsonSchema.contentEncoding}

Specify the encoding used for the contents of a string.

```typespec
@TypeSpec.JsonSchema.contentEncoding(value: valueof string)
```

#### Target

`union string | ModelProperty`

#### Parameters

| Name  | Type                    | Description |
| ----- | ----------------------- | ----------- |
| value | `valueof scalar string` | <br />      |

### `@contentMediaType` {#@TypeSpec.JsonSchema.contentMediaType}

Specify the content type of content stored in a string.

```typespec
@TypeSpec.JsonSchema.contentMediaType(value: valueof string)
```

#### Target

`union string | ModelProperty`

#### Parameters

| Name  | Type                    | Description                           |
| ----- | ----------------------- | ------------------------------------- |
| value | `valueof scalar string` | the media type of the string contents |

### `@contentSchema` {#@TypeSpec.JsonSchema.contentSchema}

Specify the schema for the contents of a string when interpreted according to the content's
media type and encoding.

```typespec
@TypeSpec.JsonSchema.contentSchema(value: unknown)
```

#### Target

`union string | ModelProperty`

#### Parameters

| Name  | Type                  | Description                       |
| ----- | --------------------- | --------------------------------- |
| value | `(intrinsic) unknown` | the schema of the string contents |

### `@extension` {#@TypeSpec.JsonSchema.extension}

Specify a custom property to add to the emitted schema. Useful for adding custom keywords
and other vendor-specific extensions. The value will be converted to a schema unless the parameter
is wrapped in the `Json<T>` template. For example, `@extension("x-schema", { x: "value" })` will
emit a JSON schema value for `x-schema`, whereas `@extension("x-schema", Json<{x: "value"}>)` will
emit the raw JSON code `{x: "value"}`.

```typespec
@TypeSpec.JsonSchema.extension(key: valueof string, value: unknown)
```

#### Target

`(intrinsic) unknown`

#### Parameters

| Name  | Type                    | Description                                                                          |
| ----- | ----------------------- | ------------------------------------------------------------------------------------ |
| key   | `valueof scalar string` | the name of the keyword of vendor extension, e.g. `x-custom`.                        |
| value | `(intrinsic) unknown`   | the value of the keyword. Will be converted to a schema unless wrapped in `Json<T>`. |

### `@id` {#@TypeSpec.JsonSchema.id}

Specify the JSON Schema id. If this model or a parent namespace has a base URI,
the provided ID will be relative to that base URI.

By default, the id will be constructed based on the declaration's name.

```typespec
@TypeSpec.JsonSchema.id(id: valueof string)
```

#### Target

`(intrinsic) unknown`

#### Parameters

| Name | Type                    | Description                                     |
| ---- | ----------------------- | ----------------------------------------------- |
| id   | `valueof scalar string` | the id of the JSON schema for this declaration. |

### `@jsonSchema` {#@TypeSpec.JsonSchema.jsonSchema}

Add to namespaces to emit models within that namespace to JSON schema.
Add to another declaration to emit that declaration to JSON schema.

Optionally, for namespaces, you can provide a baseUri, and for other declarations,
you can provide the id.

```typespec
@TypeSpec.JsonSchema.jsonSchema(baseUri?: valueof string)
```

#### Target

`(intrinsic) unknown`

#### Parameters

| Name    | Type                    | Description                                         |
| ------- | ----------------------- | --------------------------------------------------- |
| baseUri | `valueof scalar string` | Schema IDs are interpreted as relative to this URI. |

### `@maxContains` {#@TypeSpec.JsonSchema.maxContains}

Specify that the array must contain at most some number of the types provided
by the contains decorator.

```typespec
@TypeSpec.JsonSchema.maxContains(value: valueof int32)
```

#### Target

`union unknown[] | ModelProperty`

#### Parameters

| Name  | Type                   | Description                                            |
| ----- | ---------------------- | ------------------------------------------------------ |
| value | `valueof scalar int32` | The maximum number of instances the array must contain |

### `@maxProperties` {#@TypeSpec.JsonSchema.maxProperties}

Specify the maximum number of properties this object can have.

```typespec
@TypeSpec.JsonSchema.maxProperties(value: valueof int32)
```

#### Target

`union Record<unknown> | ModelProperty`

#### Parameters

| Name  | Type                   | Description                                            |
| ----- | ---------------------- | ------------------------------------------------------ |
| value | `valueof scalar int32` | The maximum number of properties this object can have. |

### `@minContains` {#@TypeSpec.JsonSchema.minContains}

Specify that the array must contain at least some number of the types provided
by the contains decorator.

```typespec
@TypeSpec.JsonSchema.minContains(value: valueof int32)
```

#### Target

`union unknown[] | ModelProperty`

#### Parameters

| Name  | Type                   | Description                                            |
| ----- | ---------------------- | ------------------------------------------------------ |
| value | `valueof scalar int32` | The minimum number of instances the array must contain |

### `@minProperties` {#@TypeSpec.JsonSchema.minProperties}

Specify the minimum number of properties this object can have.

```typespec
@TypeSpec.JsonSchema.minProperties(value: valueof int32)
```

#### Target

`union Record<unknown> | ModelProperty`

#### Parameters

| Name  | Type                   | Description                                            |
| ----- | ---------------------- | ------------------------------------------------------ |
| value | `valueof scalar int32` | The minimum number of properties this object can have. |

### `@multipleOf` {#@TypeSpec.JsonSchema.multipleOf}

Specify that the numeric type must be a multiple of some numeric value.

```typespec
@TypeSpec.JsonSchema.multipleOf(value: valueof numeric)
```

#### Target

`union numeric | ModelProperty`

#### Parameters

| Name  | Type                     | Description                                        |
| ----- | ------------------------ | -------------------------------------------------- |
| value | `valueof scalar numeric` | The numeric type must be a multiple of this value. |

### `@prefixItems` {#@TypeSpec.JsonSchema.prefixItems}

Specify that the target array must begin with the provided types.

```typespec
@TypeSpec.JsonSchema.prefixItems(value: unknown[])
```

#### Target

`union unknown[] | ModelProperty`

#### Parameters

| Name  | Type              | Description                                                                 |
| ----- | ----------------- | --------------------------------------------------------------------------- |
| value | `model unknown[]` | a tuple containing the types that must be present at the start of the array |

### `@uniqueItems` {#@TypeSpec.JsonSchema.uniqueItems}

Specify that every item in the array must be unique.

```typespec
@TypeSpec.JsonSchema.uniqueItems
```

#### Target

`union unknown[] | ModelProperty`

#### Parameters

None
