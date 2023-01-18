---
title: "Decorators"
toc_min_heading_level: 2
toc_max_heading_level: 3
---

# Decorators

## Cadl

### `@format` {#@format}

Specify a known data format hint for this string type. For example `uuid`, `uri`, etc.
This differ from the

```cadl
dec format(target: Cadl.string | Cadl.bytes | Cadl.Reflection.ModelProperty, format: Cadl.string)
```

#### Target

`union Cadl.string | Cadl.bytes | Cadl.Reflection.ModelProperty`

#### Parameters

| Name   | Type                 | Description  |
| ------ | -------------------- | ------------ |
| format | `scalar Cadl.string` | format name. |

### `@deprecated` {#@deprecated}

Mark this type as deprecated

```cadl
dec deprecated(target: unknown, message: Cadl.string)
```

#### Target

`(intrinsic) unknown`

#### Parameters

| Name    | Type                 | Description          |
| ------- | -------------------- | -------------------- |
| message | `scalar Cadl.string` | Deprecation message. |

### `@doc` {#@doc}

Attach a documentation string.

```cadl
dec doc(target: unknown, doc: Cadl.string, formatArgs?: Cadl.object)
```

#### Target

`(intrinsic) unknown`

#### Parameters

| Name       | Type                 | Description                                                     |
| ---------- | -------------------- | --------------------------------------------------------------- |
| doc        | `scalar Cadl.string` | Documentation string                                            |
| formatArgs | `model Cadl.object`  | Record with key value pair that can be interpolated in the doc. |

### `@withUpdateableProperties` {#@withUpdateableProperties}

```cadl
dec withUpdateableProperties(target: Cadl.object)
```

#### Target

`model Cadl.object`

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

### `@withoutOmittedProperties` {#@withoutOmittedProperties}

```cadl
dec withoutOmittedProperties(target: Cadl.object, omit: Cadl.string | Cadl.Reflection.Union)
```

#### Target

`model Cadl.object`

#### Parameters

| Name | Type                                         | Description |
| ---- | -------------------------------------------- | ----------- |
| omit | `union Cadl.string \| Cadl.Reflection.Union` |             |

### `@withoutDefaultValues` {#@withoutDefaultValues}

```cadl
dec withoutDefaultValues(target: Cadl.object)
```

#### Target

`model Cadl.object`

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

### `@withDefaultKeyVisibility` {#@withDefaultKeyVisibility}

```cadl
dec withDefaultKeyVisibility(target: Cadl.object, visibility: unknown)
```

#### Target

`model Cadl.object`

#### Parameters

| Name       | Type                  | Description |
| ---------- | --------------------- | ----------- |
| visibility | `(intrinsic) unknown` |             |

### `@summary` {#@summary}

Typically a short, single-line description.

```cadl
dec summary(target: unknown, summary: Cadl.string)
```

#### Target

`(intrinsic) unknown`

#### Parameters

| Name    | Type                 | Description     |
| ------- | -------------------- | --------------- |
| summary | `scalar Cadl.string` | Summary string. |

### `@service` {#@service}

Mark this namespace as describing a service and configure service properties.

```cadl
dec service(target: Cadl.Reflection.Namespace, options?: Cadl.ServiceOptions)
```

#### Target

`Namespace`

#### Parameters

| Name    | Type                        | Description                             |
| ------- | --------------------------- | --------------------------------------- |
| options | `model Cadl.ServiceOptions` | Optional configuration for the service. |

### `@error` {#@error}

Specify that this model is an error type. Operations return error types when the operation has failed.

```cadl
dec error(target: Cadl.object)
```

#### Target

`model Cadl.object`

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

#### Examples

```cadl
@error
model PetStoreError {
code: string;
message: string;
}
```

### `@pattern` {#@pattern}

Specify the the pattern this string should respect using simple regular expression syntax.
The following syntax is allowed: alternations (`|`), quantifiers (`?`, `*`, `+`, and `{ }`), wildcard (`.`), and grouping parentheses.
Advanced features like look-around, capture groups, and references are not supported.

```cadl
dec pattern(target: Cadl.string | Cadl.bytes | Cadl.Reflection.ModelProperty, pattern: Cadl.string)
```

#### Target

`union Cadl.string | Cadl.bytes | Cadl.Reflection.ModelProperty`

#### Parameters

| Name    | Type                 | Description         |
| ------- | -------------------- | ------------------- |
| pattern | `scalar Cadl.string` | Regular expression. |

### `@minLength` {#@minLength}

Specify the minimum length this string type should be.

```cadl
dec minLength(target: Cadl.string | Cadl.Reflection.ModelProperty, value: Cadl.integer)
```

#### Target

`union Cadl.string | Cadl.Reflection.ModelProperty`

#### Parameters

| Name  | Type                  | Description    |
| ----- | --------------------- | -------------- |
| value | `scalar Cadl.integer` | Minimum length |

### `@maxLength` {#@maxLength}

Specify the maximum length this string type should be.

```cadl
dec maxLength(target: Cadl.string | Cadl.Reflection.ModelProperty, value: Cadl.integer)
```

#### Target

`union Cadl.string | Cadl.Reflection.ModelProperty`

#### Parameters

| Name  | Type                  | Description    |
| ----- | --------------------- | -------------- |
| value | `scalar Cadl.integer` | Maximum length |

### `@minItems` {#@minItems}

Specify the minimum number of items this array should have.

```cadl
dec minItems(target: unknown[] | Cadl.Reflection.ModelProperty, value: Cadl.integer)
```

#### Target

`union unknown[] | Cadl.Reflection.ModelProperty`

#### Parameters

| Name  | Type                  | Description    |
| ----- | --------------------- | -------------- |
| value | `scalar Cadl.integer` | Minimum number |

### `@maxItems` {#@maxItems}

Specify the maximum number of items this array should have.

```cadl
dec maxItems(target: unknown[] | Cadl.Reflection.ModelProperty, value: Cadl.integer)
```

#### Target

`union unknown[] | Cadl.Reflection.ModelProperty`

#### Parameters

| Name  | Type                  | Description    |
| ----- | --------------------- | -------------- |
| value | `scalar Cadl.integer` | Maximum number |

### `@minValue` {#@minValue}

Specify the minimum value this numeric type should be.

```cadl
dec minValue(target: Cadl.numeric | Cadl.Reflection.ModelProperty, value: Cadl.numeric)
```

#### Target

`union Cadl.numeric | Cadl.Reflection.ModelProperty`

#### Parameters

| Name  | Type                  | Description   |
| ----- | --------------------- | ------------- |
| value | `scalar Cadl.numeric` | Minimum value |

### `@maxValue` {#@maxValue}

Specify the maximum value this numeric type should be.

```cadl
dec maxValue(target: Cadl.numeric | Cadl.Reflection.ModelProperty, value: Cadl.numeric)
```

#### Target

`union Cadl.numeric | Cadl.Reflection.ModelProperty`

#### Parameters

| Name  | Type                  | Description   |
| ----- | --------------------- | ------------- |
| value | `scalar Cadl.numeric` | Maximum value |

### `@minValueExclusive` {#@minValueExclusive}

Specify the minimum value this numeric type should be, exclusive of the given
value.

```cadl
dec minValueExclusive(target: Cadl.numeric | Cadl.Reflection.ModelProperty, value: Cadl.numeric)
```

#### Target

`union Cadl.numeric | Cadl.Reflection.ModelProperty`

#### Parameters

| Name  | Type                  | Description   |
| ----- | --------------------- | ------------- |
| value | `scalar Cadl.numeric` | Minimum value |

### `@maxValueExclusive` {#@maxValueExclusive}

Specify the maximum value this numeric type should be, exclusive of the given
value.

```cadl
dec maxValueExclusive(target: Cadl.numeric | Cadl.Reflection.ModelProperty, value: Cadl.numeric)
```

#### Target

`union Cadl.numeric | Cadl.Reflection.ModelProperty`

#### Parameters

| Name  | Type                  | Description   |
| ----- | --------------------- | ------------- |
| value | `scalar Cadl.numeric` | Maximum value |

### `@secret` {#@secret}

Mark this string as a secret value that should be treated carefully to avoid exposure

```cadl
dec secret(target: Cadl.string | Cadl.Reflection.ModelProperty)
```

#### Target

`union Cadl.string | Cadl.Reflection.ModelProperty`

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

#### Examples

```cadl
@secret
scalar Password is string;
```

### `@tag` {#@tag}

Attaches a tag to an operation, interface, or namespace. Multiple `@tag` decorators can be specified to attach multiple tags to a Cadl element.

```cadl
dec tag(target: Cadl.Reflection.Namespace | Cadl.Reflection.Interface | Cadl.Reflection.Operation, tag: Cadl.string)
```

#### Target

`union Cadl.Reflection.Namespace | Cadl.Reflection.Interface | Cadl.Reflection.Operation`

#### Parameters

| Name | Type                 | Description |
| ---- | -------------------- | ----------- |
| tag  | `scalar Cadl.string` | Tag value   |

### `@friendlyName` {#@friendlyName}

Specifies how a templated type should name their instances.

```cadl
dec friendlyName(target: unknown, name: Cadl.string, formatArgs?: unknown)
```

#### Target

`(intrinsic) unknown`

#### Parameters

| Name       | Type                  | Description                            |
| ---------- | --------------------- | -------------------------------------- |
| name       | `scalar Cadl.string`  | name the template instance should take |
| formatArgs | `(intrinsic) unknown` |                                        |

### `@knownValues` {#@knownValues}

Provide a set of known values to a string type.

```cadl
dec knownValues(target: Cadl.string | Cadl.numeric | Cadl.Reflection.ModelProperty, values: Cadl.Reflection.Enum)
```

#### Target

`union Cadl.string | Cadl.numeric | Cadl.Reflection.ModelProperty`

#### Parameters

| Name   | Type   | Description        |
| ------ | ------ | ------------------ |
| values | `Enum` | Known values enum. |

### `@key` {#@key}

Mark a model property as the key to identify instances of that type

```cadl
dec key(target: Cadl.Reflection.ModelProperty, altName?: Cadl.string)
```

#### Target

`ModelProperty`

#### Parameters

| Name    | Type                 | Description |
| ------- | -------------------- | ----------- |
| altName | `scalar Cadl.string` |             |

#### Examples

```cadl
model Pet {
@key id: string;
}
```

### `@overload` {#@overload}

Specify this operation is an overload of the given operation.

```cadl
dec overload(target: Cadl.Reflection.Operation, overloadbase: Cadl.Reflection.Operation)
```

#### Target

`Operation`

#### Parameters

| Name         | Type        | Description                                            |
| ------------ | ----------- | ------------------------------------------------------ |
| overloadbase | `Operation` | Base operation that should be a union of all overloads |

### `@projectedName` {#@projectedName}

Provide an alternative name for this type.

```cadl
dec projectedName(target: unknown, targetName: Cadl.string, projectedName: Cadl.string)
```

#### Target

`(intrinsic) unknown`

#### Parameters

| Name          | Type                 | Description       |
| ------------- | -------------------- | ----------------- |
| targetName    | `scalar Cadl.string` | Projection target |
| projectedName | `scalar Cadl.string` | Alternative name  |

### `@discriminator` {#@discriminator}

Specify the property to be used to discriminate this type.

```cadl
dec discriminator(target: Cadl.object | Cadl.Reflection.Union, propertyName: Cadl.string)
```

#### Target

`union Cadl.object | Cadl.Reflection.Union`

#### Parameters

| Name         | Type                 | Description |
| ------------ | -------------------- | ----------- |
| propertyName | `scalar Cadl.string` |             |

#### Examples

```cadl
@discriminator("kind")
union Pet{ cat: Cat, dog: Dog }

model Cat {kind: "cat", meow: boolean}
model Dog {kind: "dog", bark: boolean}
```

```cadl
@discriminator("kind")
model Pet{ kind: string }

model Cat extends Pet {kind: "cat", meow: boolean}
model Dog extends Pet  {kind: "dog", bark: boolean}
```

### `@visibility` {#@visibility}

Indicates that a property is only considered to be present or applicable ("visible") with
the in the given named contexts ("visibilities"). When a property has no visibilities applied
to it, it is implicitly visible always.

As far as the Cadl core library is concerned, visibilities are open-ended and can be arbitrary
strings, but the following visibilities are well-known to standard libraries and should be used
with standard emitters that interpret them as follows:

- "read": output of any operation.
- "create": input to operations that create an entity..
- "query": input to operations that read data.
- "update": input to operations that update data.
- "delete": input to operations that delete data.

See also: [Automatic visibility](https://microsoft.github.io/cadl/standard-library/rest/operations#automatic-visibility)

```cadl
dec visibility(target: Cadl.Reflection.ModelProperty, ...visibilities: Cadl.string[])
```

#### Target

`ModelProperty`

#### Parameters

| Name         | Type                  | Description |
| ------------ | --------------------- | ----------- |
| visibilities | `model Cadl.string[]` |             |

#### Examples

```cadl
model Dog {
// the service will generate an ID, so you don't need to send it.
@visibility("read") id: int32;
// the service will store this secret name, but won't ever return it
@visibility("create", "update") secretName: string;
// the regular name is always present
name: string;
}
```

### `@withVisibility` {#@withVisibility}

Removes properties that are not considered to be present or applicable
("visible") in the given named contexts ("visibilities"). Can be used
together with spread to effectively spread only visible properties into
a new model.

See also: [Automatic visibility](https://microsoft.github.io/cadl/standard-library/rest/operations#automatic-visibility)

When using an emitter that applies visibility automatically, it is generally
not necessary to use this decorator.

```cadl
dec withVisibility(target: Cadl.object, ...visibilities: Cadl.string[])
```

#### Target

`model Cadl.object`

#### Parameters

| Name         | Type                  | Description |
| ------------ | --------------------- | ----------- |
| visibilities | `model Cadl.string[]` |             |

#### Examples

```cadl
model Dog {
@visibility("read") id: int32;
@visibility("create", "update") secretName: string;
name: string;
}

// The spread operator will copy all the properties of Dog into DogRead,
// and @withVisibility will then remove those that are not visible with
// create or update visibility.
//
// In this case, the id property is removed, and the name and secretName
// properties are kept.
@withVisibility("create", "update")
model DogCreateOrUpdate {
...Dog;
}

// In this case the id and name properties are kept and the secretName property
// is removed.
@withVisibility("read")
model DogRead {
...Dog;
}
```

### `@inspectType` {#@inspectType}

```cadl
dec inspectType(target: unknown, text: Cadl.string)
```

#### Target

`(intrinsic) unknown`

#### Parameters

| Name | Type                 | Description |
| ---- | -------------------- | ----------- |
| text | `scalar Cadl.string` |             |

### `@inspectTypeName` {#@inspectTypeName}

```cadl
dec inspectTypeName(target: unknown, text: Cadl.string)
```

#### Target

`(intrinsic) unknown`

#### Parameters

| Name | Type                 | Description |
| ---- | -------------------- | ----------- |
| text | `scalar Cadl.string` |             |
