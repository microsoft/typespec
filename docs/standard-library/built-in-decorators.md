---
title: "Built-in Decorators"
toc_min_heading_level: 2
toc_max_heading_level: 3
---
# Built-in Decorators
## TypeSpec

### `@deprecated` {#@deprecated}

Mark this type as deprecated

```typespec
dec deprecated(target: unknown, message: string)
```

#### Target

`(intrinsic) unknown`

#### Parameters
| Name | Type | Description |
|------|------|-------------|
| message | `scalar string` | Deprecation message. |


### `@discriminator` {#@discriminator}

Specify the property to be used to discriminate this type.

```typespec
dec discriminator(target: Model | Union, propertyName: string)
```

#### Target

`union Model | Union`

#### Parameters
| Name | Type | Description |
|------|------|-------------|
| propertyName | `scalar string` | The property name to use for discrimination |


### `@doc` {#@doc}

Attach a documentation string.

```typespec
dec doc(target: unknown, doc: string, formatArgs?: object)
```

#### Target

`(intrinsic) unknown`

#### Parameters
| Name | Type | Description |
|------|------|-------------|
| doc | `scalar string` | Documentation string |
| formatArgs | `model object` | Record with key value pair that can be interpolated in the doc. |


### `@error` {#@error}

Specify that this model is an error type. Operations return error types when the operation has failed.

```typespec
dec error(target: Model)
```

#### Target

`Model`

#### Parameters
None

#### Examples

```typespec
@error
model PetStoreError {
code: string;
message: string;
}
```


### `@format` {#@format}

Specify a known data format hint for this string type. For example `uuid`, `uri`, etc.
This differs from the `@pattern` decorator which is meant to specify a regular expression while `@format` accepts a known format name.
The format names are open ended and are left to emitter to interpret.

```typespec
dec format(target: string | bytes | ModelProperty, format: string)
```

#### Target

`union string | bytes | ModelProperty`

#### Parameters
| Name | Type | Description |
|------|------|-------------|
| format | `scalar string` | format name. |


### `@friendlyName` {#@friendlyName}

Specifies how a templated type should name their instances.

```typespec
dec friendlyName(target: unknown, name: string, formatArgs?: unknown)
```

#### Target

`(intrinsic) unknown`

#### Parameters
| Name | Type | Description |
|------|------|-------------|
| name | `scalar string` | name the template instance should take |
| formatArgs | `(intrinsic) unknown` | Model with key value used to interpolate the name |


### `@inspectType` {#@inspectType}

A debugging decorator used to inspect a type.

```typespec
dec inspectType(target: unknown, text: string)
```

#### Target

`(intrinsic) unknown`

#### Parameters
| Name | Type | Description |
|------|------|-------------|
| text | `scalar string` | Custom text to log |


### `@inspectTypeName` {#@inspectTypeName}

A debugging decorator used to inspect a type name.

```typespec
dec inspectTypeName(target: unknown, text: string)
```

#### Target

`(intrinsic) unknown`

#### Parameters
| Name | Type | Description |
|------|------|-------------|
| text | `scalar string` | Custom text to log |


### `@key` {#@key}

Mark a model property as the key to identify instances of that type

```typespec
dec key(target: ModelProperty, altName?: string)
```

#### Target

`ModelProperty`

#### Parameters
| Name | Type | Description |
|------|------|-------------|
| altName | `scalar string` | Name of the property. If not specified, the decorated property name is used. |


### `@knownValues` {#@knownValues}

Provide a set of known values to a string type.

```typespec
dec knownValues(target: string | numeric | ModelProperty, values: Enum)
```

#### Target

`union string | numeric | ModelProperty`

#### Parameters
| Name | Type | Description |
|------|------|-------------|
| values | `Enum` | Known values enum. |


### `@maxItems` {#@maxItems}

Specify the maximum number of items this array should have.

```typespec
dec maxItems(target: unknown[] | ModelProperty, value: integer)
```

#### Target

`union unknown[] | ModelProperty`

#### Parameters
| Name | Type | Description |
|------|------|-------------|
| value | `scalar integer` | Maximum number |


### `@maxLength` {#@maxLength}

Specify the maximum length this string type should be.

```typespec
dec maxLength(target: string | ModelProperty, value: integer)
```

#### Target

`union string | ModelProperty`

#### Parameters
| Name | Type | Description |
|------|------|-------------|
| value | `scalar integer` | Maximum length |


### `@maxValue` {#@maxValue}

Specify the maximum value this numeric type should be.

```typespec
dec maxValue(target: numeric | ModelProperty, value: numeric)
```

#### Target

`union numeric | ModelProperty`

#### Parameters
| Name | Type | Description |
|------|------|-------------|
| value | `scalar numeric` | Maximum value |


### `@maxValueExclusive` {#@maxValueExclusive}

Specify the maximum value this numeric type should be, exclusive of the given
value.

```typespec
dec maxValueExclusive(target: numeric | ModelProperty, value: numeric)
```

#### Target

`union numeric | ModelProperty`

#### Parameters
| Name | Type | Description |
|------|------|-------------|
| value | `scalar numeric` | Maximum value |


### `@minItems` {#@minItems}

Specify the minimum number of items this array should have.

```typespec
dec minItems(target: unknown[] | ModelProperty, value: integer)
```

#### Target

`union unknown[] | ModelProperty`

#### Parameters
| Name | Type | Description |
|------|------|-------------|
| value | `scalar integer` | Minimum number |


### `@minLength` {#@minLength}

Specify the minimum length this string type should be.

```typespec
dec minLength(target: string | ModelProperty, value: integer)
```

#### Target

`union string | ModelProperty`

#### Parameters
| Name | Type | Description |
|------|------|-------------|
| value | `scalar integer` | Minimum length |


### `@minValue` {#@minValue}

Specify the minimum value this numeric type should be.

```typespec
dec minValue(target: numeric | ModelProperty, value: numeric)
```

#### Target

`union numeric | ModelProperty`

#### Parameters
| Name | Type | Description |
|------|------|-------------|
| value | `scalar numeric` | Minimum value |


### `@minValueExclusive` {#@minValueExclusive}

Specify the minimum value this numeric type should be, exclusive of the given
value.

```typespec
dec minValueExclusive(target: numeric | ModelProperty, value: numeric)
```

#### Target

`union numeric | ModelProperty`

#### Parameters
| Name | Type | Description |
|------|------|-------------|
| value | `scalar numeric` | Minimum value |


### `@overload` {#@overload}

Specify this operation is an overload of the given operation.

```typespec
dec overload(target: Operation, overloadbase: Operation)
```

#### Target

`Operation`

#### Parameters
| Name | Type | Description |
|------|------|-------------|
| overloadbase | `Operation` | Base operation that should be a union of all overloads |


### `@pattern` {#@pattern}

Specify the the pattern this string should respect using simple regular expression syntax.
The following syntax is allowed: alternations (`|`), quantifiers (`?`, `*`, `+`, and `{ }`), wildcard (`.`), and grouping parentheses.
Advanced features like look-around, capture groups, and references are not supported.

```typespec
dec pattern(target: string | bytes | ModelProperty, pattern: string)
```

#### Target

`union string | bytes | ModelProperty`

#### Parameters
| Name | Type | Description |
|------|------|-------------|
| pattern | `scalar string` | Regular expression. |


### `@projectedName` {#@projectedName}

Provide an alternative name for this type.

```typespec
dec projectedName(target: unknown, targetName: string, projectedName: string)
```

#### Target

`(intrinsic) unknown`

#### Parameters
| Name | Type | Description |
|------|------|-------------|
| targetName | `scalar string` | Projection target |
| projectedName | `scalar string` | Alternative name |


### `@secret` {#@secret}

Mark this string as a secret value that should be treated carefully to avoid exposure

```typespec
dec secret(target: string | ModelProperty)
```

#### Target

`union string | ModelProperty`

#### Parameters
None

#### Examples

```typespec
@secret
scalar Password is string;
```


### `@service` {#@service}

Mark this namespace as describing a service and configure service properties.

```typespec
dec service(target: Namespace, options?: ServiceOptions)
```

#### Target

`Namespace`

#### Parameters
| Name | Type | Description |
|------|------|-------------|
| options | `model ServiceOptions` | Optional configuration for the service. |


### `@summary` {#@summary}

Typically a short, single-line description.

```typespec
dec summary(target: unknown, summary: string)
```

#### Target

`(intrinsic) unknown`

#### Parameters
| Name | Type | Description |
|------|------|-------------|
| summary | `scalar string` | Summary string. |


### `@tag` {#@tag}

Attaches a tag to an operation, interface, or namespace. Multiple `@tag` decorators can be specified to attach multiple tags to a TypeSpec element.

```typespec
dec tag(target: Namespace | Interface | Operation, tag: string)
```

#### Target

`union Namespace | Interface | Operation`

#### Parameters
| Name | Type | Description |
|------|------|-------------|
| tag | `scalar string` | Tag value |


### `@visibility` {#@visibility}

Indicates that a property is only considered to be present or applicable ("visible") with
the in the given named contexts ("visibilities"). When a property has no visibilities applied
to it, it is implicitly visible always.

As far as the TypeSpec core library is concerned, visibilities are open-ended and can be arbitrary
strings, but  the following visibilities are well-known to standard libraries and should be used
with standard emitters that interpret them as follows:

- "read": output of any operation.
- "create": input to operations that create an entity..
- "query": input to operations that read data.
- "update": input to operations that update data.
- "delete": input to operations that delete data.

See also: [Automatic visibility](https://microsoft.github.io/typespec/standard-library/rest/operations#automatic-visibility)

```typespec
dec visibility(target: ModelProperty, ...visibilities: string[])
```

#### Target

`ModelProperty`

#### Parameters
| Name | Type | Description |
|------|------|-------------|
| visibilities | `model string[]` | List of visibilties which apply to this property. |


### `@withDefaultKeyVisibility` {#@withDefaultKeyVisibility}

Set the visibility of key properties in a model if not already set.

```typespec
dec withDefaultKeyVisibility(target: Model, visibility: unknown)
```

#### Target

`Model`

#### Parameters
| Name | Type | Description |
|------|------|-------------|
| visibility | `(intrinsic) unknown` | The desired default visibility value. If a key property already has a `visibility` decorator then the default visibility is not applied. |


### `@withoutDefaultValues` {#@withoutDefaultValues}

Returns the model with any default values removed.

```typespec
dec withoutDefaultValues(target: Model)
```

#### Target

`Model`

#### Parameters
None


### `@withoutOmittedProperties` {#@withoutOmittedProperties}

Returns the model with the given properties omitted.

```typespec
dec withoutOmittedProperties(target: Model, omit: string | Union)
```

#### Target

`Model`

#### Parameters
| Name | Type | Description |
|------|------|-------------|
| omit | `union string \| Union` | List of properties to omit |


### `@withUpdateableProperties` {#@withUpdateableProperties}

Returns the model with non-updateable properties removed.

```typespec
dec withUpdateableProperties(target: Model)
```

#### Target

`Model`

#### Parameters
None


### `@withVisibility` {#@withVisibility}

Removes properties that are not considered to be present or applicable
("visible") in the given named contexts ("visibilities"). Can be used
together with spread to effectively spread only visible properties into
a new model.

See also: [Automatic visibility](https://microsoft.github.io/typespec/standard-library/rest/operations#automatic-visibility)

When using an emitter that applies visibility automatically, it is generally
not necessary to use this decorator.

```typespec
dec withVisibility(target: Model, ...visibilities: string[])
```

#### Target

`Model`

#### Parameters
| Name | Type | Description |
|------|------|-------------|
| visibilities | `model string[]` | List of visibilties which apply to this property. |


