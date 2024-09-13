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

| Name    | Type             | Description                                                              |
| ------- | ---------------- | ------------------------------------------------------------------------ |
| baseUri | `valueof string` | the base URI. Schema IDs inside this namespace are relative to this URI. |

### `@contains` {#@TypeSpec.JsonSchema.contains}

Specify that the array must contain at least one instance of the provided type.
Use `@minContains` and `@maxContains` to customize how many instances to expect.

```typespec
@TypeSpec.JsonSchema.contains(value: unknown)
```

#### Target

`unknown[] | ModelProperty`

#### Parameters

| Name  | Type      | Description                      |
| ----- | --------- | -------------------------------- |
| value | `unknown` | The type the array must contain. |

### `@contentEncoding` {#@TypeSpec.JsonSchema.contentEncoding}

Specify the encoding used for the contents of a string.

```typespec
@TypeSpec.JsonSchema.contentEncoding(value: valueof string)
```

#### Target

`string | ModelProperty`

#### Parameters

| Name  | Type             | Description |
| ----- | ---------------- | ----------- |
| value | `valueof string` | <br />      |

### `@contentMediaType` {#@TypeSpec.JsonSchema.contentMediaType}

Specify the content type of content stored in a string.

```typespec
@TypeSpec.JsonSchema.contentMediaType(value: valueof string)
```

#### Target

`string | ModelProperty`

#### Parameters

| Name  | Type             | Description                           |
| ----- | ---------------- | ------------------------------------- |
| value | `valueof string` | the media type of the string contents |

### `@contentSchema` {#@TypeSpec.JsonSchema.contentSchema}

Specify the schema for the contents of a string when interpreted according to the content's
media type and encoding.

```typespec
@TypeSpec.JsonSchema.contentSchema(value: unknown)
```

#### Target

`string | ModelProperty`

#### Parameters

| Name  | Type      | Description                       |
| ----- | --------- | --------------------------------- |
| value | `unknown` | the schema of the string contents |

### `@extension` {#@TypeSpec.JsonSchema.extension}

Specify a custom property to add to the emitted schema. Useful for adding custom keywords
and other vendor-specific extensions. Scalar values need to be specified using `typeof` to be converted to a schema.

For example, `@extension("x-schema", typeof "foo")` will emit a JSON schema value for `x-schema`,
whereas `@extension("x-schema", "foo")` will emit the raw code `"foo"`.

The value will be treated as a raw value if any of the following are true:

1. The value is a scalar value (e.g. string, number, boolean, etc.)
2. The value is wrapped in the `Json<Data>` template
3. The value is provided using the value syntax (e.g. `#{}`, `#[]`)

For example, `@extension("x-schema", { x: "value" })` will emit a JSON schema value for `x-schema`,
whereas `@extension("x-schema", #{x: "value"})` and `@extension("x-schema", Json<{x: "value"}>)`
will emit the raw JSON code `{x: "value"}`.

```typespec
@TypeSpec.JsonSchema.extension(key: valueof string, value: unknown | valueof unknown)
```

#### Target

`unknown`

#### Parameters

| Name  | Type                           | Description                                                   |
| ----- | ------------------------------ | ------------------------------------------------------------- |
| key   | `valueof string`               | the name of the keyword of vendor extension, e.g. `x-custom`. |
| value | `unknown` \| `valueof unknown` | the value of the keyword.                                     |

### `@id` {#@TypeSpec.JsonSchema.id}

Specify the JSON Schema id. If this model or a parent namespace has a base URI,
the provided ID will be relative to that base URI.

By default, the id will be constructed based on the declaration's name.

```typespec
@TypeSpec.JsonSchema.id(id: valueof string)
```

#### Target

`unknown`

#### Parameters

| Name | Type             | Description                                     |
| ---- | ---------------- | ----------------------------------------------- |
| id   | `valueof string` | the id of the JSON schema for this declaration. |

### `@jsonSchema` {#@TypeSpec.JsonSchema.jsonSchema}

Add to namespaces to emit models within that namespace to JSON schema.
Add to another declaration to emit that declaration to JSON schema.

Optionally, for namespaces, you can provide a baseUri, and for other declarations,
you can provide the id.

```typespec
@TypeSpec.JsonSchema.jsonSchema(baseUri?: valueof string)
```

#### Target

`unknown`

#### Parameters

| Name    | Type             | Description                                         |
| ------- | ---------------- | --------------------------------------------------- |
| baseUri | `valueof string` | Schema IDs are interpreted as relative to this URI. |

### `@maxContains` {#@TypeSpec.JsonSchema.maxContains}

Specify that the array must contain at most some number of the types provided
by the contains decorator.

```typespec
@TypeSpec.JsonSchema.maxContains(value: valueof int32)
```

#### Target

`unknown[] | ModelProperty`

#### Parameters

| Name  | Type            | Description                                            |
| ----- | --------------- | ------------------------------------------------------ |
| value | `valueof int32` | The maximum number of instances the array must contain |

### `@maxProperties` {#@TypeSpec.JsonSchema.maxProperties}

Specify the maximum number of properties this object can have.

```typespec
@TypeSpec.JsonSchema.maxProperties(value: valueof int32)
```

#### Target

`Record<unknown> | ModelProperty`

#### Parameters

| Name  | Type            | Description                                            |
| ----- | --------------- | ------------------------------------------------------ |
| value | `valueof int32` | The maximum number of properties this object can have. |

### `@minContains` {#@TypeSpec.JsonSchema.minContains}

Specify that the array must contain at least some number of the types provided
by the contains decorator.

```typespec
@TypeSpec.JsonSchema.minContains(value: valueof int32)
```

#### Target

`unknown[] | ModelProperty`

#### Parameters

| Name  | Type            | Description                                            |
| ----- | --------------- | ------------------------------------------------------ |
| value | `valueof int32` | The minimum number of instances the array must contain |

### `@minProperties` {#@TypeSpec.JsonSchema.minProperties}

Specify the minimum number of properties this object can have.

```typespec
@TypeSpec.JsonSchema.minProperties(value: valueof int32)
```

#### Target

`Record<unknown> | ModelProperty`

#### Parameters

| Name  | Type            | Description                                            |
| ----- | --------------- | ------------------------------------------------------ |
| value | `valueof int32` | The minimum number of properties this object can have. |

### `@multipleOf` {#@TypeSpec.JsonSchema.multipleOf}

Specify that the numeric type must be a multiple of some numeric value.

```typespec
@TypeSpec.JsonSchema.multipleOf(value: valueof numeric)
```

#### Target

`numeric | ModelProperty`

#### Parameters

| Name  | Type              | Description                                        |
| ----- | ----------------- | -------------------------------------------------- |
| value | `valueof numeric` | The numeric type must be a multiple of this value. |

### `@oneOf` {#@TypeSpec.JsonSchema.oneOf}

Specify that `oneOf` should be used instead of `anyOf` for that union.

```typespec
@TypeSpec.JsonSchema.oneOf
```

#### Target

`Union | ModelProperty`

#### Parameters

None

### `@prefixItems` {#@TypeSpec.JsonSchema.prefixItems}

Specify that the target array must begin with the provided types.

```typespec
@TypeSpec.JsonSchema.prefixItems(value: unknown[])
```

#### Target

`unknown[] | ModelProperty`

#### Parameters

| Name  | Type        | Description                                                                 |
| ----- | ----------- | --------------------------------------------------------------------------- |
| value | `unknown[]` | a tuple containing the types that must be present at the start of the array |

### `@uniqueItems` {#@TypeSpec.JsonSchema.uniqueItems}

Specify that every item in the array must be unique.

```typespec
@TypeSpec.JsonSchema.uniqueItems
```

#### Target

`unknown[] | ModelProperty`

#### Parameters

None
