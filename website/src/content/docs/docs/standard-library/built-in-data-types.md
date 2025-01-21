---
title: "Built-in Data types"
---
## TypeSpec
### `Array` {#Array}



```typespec
model Array<Element>
```

#### Template Parameters
| Name | Description |
|------|-------------|
| Element | The type of the array elements |


#### Properties
None

### `Create` {#Create}

A copy of the input model `T` with only the properties that are visible during the
"Create" resource lifecycle phase.

This transformation is recursive, and will include only properties that have the
`Lifecycle.Create` visibility modifier.

If a `NameTemplate` is provided, the new model will be named according to the template.
The template uses the same syntax as the `@friendlyName` decorator.
```typespec
model Create<T, NameTemplate>
```

#### Template Parameters
| Name | Description |
|------|-------------|
| T | The model to transform. |
| NameTemplate | The name template to use for the new model.<br /><br />* |

#### Examples

```typespec
model Dog {
  @visibility(Lifecycle.Read)
  id: int32;

  name: string;
}

model CreateDog is Create<Dog>;
```

#### Properties
None

### `CreateOrUpdate` {#CreateOrUpdate}

A copy of the input model `T` with only the properties that are visible during the
"Create" or "Update" resource lifecycle phases.

This transformation is recursive, and will include only properties that have the
`Lifecycle.Create` or `Lifecycle.Update` visibility modifier.

If a `NameTemplate` is provided, the new model will be named according to the template.
The template uses the same syntax as the `@friendlyName` decorator.
```typespec
model CreateOrUpdate<T, NameTemplate>
```

#### Template Parameters
| Name | Description |
|------|-------------|
| T | The model to transform. |
| NameTemplate | The name template to use for the new model.<br /><br />* |

#### Examples

```typespec
model Dog {
  @visibility(Lifecycle.Read)
  id: int32;

  name: string;
}

model CreateOrUpdateDog is CreateOrUpdate<Dog>;
```

#### Properties
None

### `DefaultKeyVisibility` {#DefaultKeyVisibility}

Applies a visibility setting to a collection of properties.
```typespec
model DefaultKeyVisibility<Source, Visibility>
```

#### Template Parameters
| Name | Description |
|------|-------------|
| Source | An object whose properties are spread. |
| Visibility | The visibility to apply to all properties. |


#### Properties
None

### `ExampleOptions` {#ExampleOptions}

Options for example decorators
```typespec
model ExampleOptions
```


#### Properties
| Name | Type | Description |
|------|------|-------------|
| title? | [`string`](#string) | The title of the example |
| description? | [`string`](#string) | Description of the example |

### `object` {#object}
:::caution
**Deprecated**: object is deprecated. Please use {} for an empty model, `Record<unknown>` for a record with unknown property types, `unknown[]` for an array.
:::

Represent a model
```typespec
model object
```


#### Properties
None

### `OmitDefaults` {#OmitDefaults}

Represents a collection of properties with default values omitted.
```typespec
model OmitDefaults<Source>
```

#### Template Parameters
| Name | Description |
|------|-------------|
| Source | An object whose spread property defaults are all omitted. |


#### Properties
None

### `OmitProperties` {#OmitProperties}

Represents a collection of omitted properties.
```typespec
model OmitProperties<Source, Keys>
```

#### Template Parameters
| Name | Description |
|------|-------------|
| Source | An object whose properties are spread. |
| Keys | The property keys to omit. |


#### Properties
None

### `OperationExample` {#OperationExample}

Operation example configuration.
```typespec
model OperationExample
```


#### Properties
| Name | Type | Description |
|------|------|-------------|
| parameters? | `unknown` | Example request body. |
| returnType? | `unknown` | Example response body. |

### `OptionalProperties` {#OptionalProperties}

Represents a collection of optional properties.
```typespec
model OptionalProperties<Source>
```

#### Template Parameters
| Name | Description |
|------|-------------|
| Source | An object whose spread properties are all optional. |


#### Properties
None

### `PickProperties` {#PickProperties}

Represents a collection of properties with only the specified keys included.
```typespec
model PickProperties<Source, Keys>
```

#### Template Parameters
| Name | Description |
|------|-------------|
| Source | An object whose properties are spread. |
| Keys | The property keys to include. |


#### Properties
None

### `Read` {#Read}

A copy of the input model `T` with only the properties that are visible during the
"Read" resource lifecycle phase.

This transformation is recursive, and will include only properties that have the
`Lifecycle.Read` visibility modifier.

If a `NameTemplate` is provided, the new model will be named according to the template.
The template uses the same syntax as the `@friendlyName` decorator.
```typespec
model Read<T, NameTemplate>
```

#### Template Parameters
| Name | Description |
|------|-------------|
| T | The model to transform. |
| NameTemplate | The name template to use for the new model.<br /><br />* |

#### Examples

```typespec
model Dog {
  @visibility(Lifecycle.Read)
  id: int32;

  name: string;
}

model ReadDog is Read<Dog>;
```

#### Properties
None

### `Record` {#Record}



```typespec
model Record<Element>
```

#### Template Parameters
| Name | Description |
|------|-------------|
| Element | The type of the properties |


#### Properties
None

### `ServiceOptions` {#ServiceOptions}

Service options.
```typespec
model ServiceOptions
```


#### Properties
| Name | Type | Description |
|------|------|-------------|
| title? | [`string`](#string) | Title of the service. |
| version? | [`string`](#string) | Version of the service. |

### `Update` {#Update}

A copy of the input model `T` with only the properties that are visible during the
"Update" resource lifecycle phase.

This transformation will include only the properties that have the `Lifecycle.Update`
visibility modifier, and the types of all properties will be replaced with the
equivalent `CreateOrUpdate` transformation.

If a `NameTemplate` is provided, the new model will be named according to the template.
The template uses the same syntax as the `@friendlyName` decorator.
```typespec
model Update<T, NameTemplate>
```

#### Template Parameters
| Name | Description |
|------|-------------|
| T | The model to transform. |
| NameTemplate | The name template to use for the new model.<br /><br />* |

#### Examples

```typespec
model Dog {
  @visibility(Lifecycle.Read)
  id: int32;

  name: string;
}

model UpdateDog is Update<Dog>;
```

#### Properties
None

### `UpdateableProperties` {#UpdateableProperties}

Represents a collection of updateable properties.
```typespec
model UpdateableProperties<Source>
```

#### Template Parameters
| Name | Description |
|------|-------------|
| Source | An object whose spread properties are all updateable. |


#### Properties
None

### `VisibilityFilter` {#VisibilityFilter}

A visibility filter, used to specify which properties should be included when
using the `withVisibilityFilter` decorator.

The filter matches any property with ALL of the following:
- If the `any` key is present, the property must have at least one of the specified visibilities.
- If the `all` key is present, the property must have all of the specified visibilities.
- If the `none` key is present, the property must have none of the specified visibilities.
```typespec
model VisibilityFilter
```


#### Properties
| Name | Type | Description |
|------|------|-------------|
| any? | `EnumMember[]` |  |
| all? | `EnumMember[]` |  |
| none? | `EnumMember[]` |  |

### `ArrayEncoding` {#ArrayEncoding}

Encoding for serializing arrays
```typespec
enum ArrayEncoding
```

| Name | Value | Description |
|------|-------|-------------|
| pipeDelimited |  | Each values of the array is separated by a \| |
| spaceDelimited |  | Each values of the array is separated by a <space> |


### `BytesKnownEncoding` {#BytesKnownEncoding}

Known encoding to use on bytes
```typespec
enum BytesKnownEncoding
```

| Name | Value | Description |
|------|-------|-------------|
| base64 | `"base64"` | Encode to Base64 |
| base64url | `"base64url"` | Encode to Base64 Url |


### `DateTimeKnownEncoding` {#DateTimeKnownEncoding}

Known encoding to use on utcDateTime or offsetDateTime
```typespec
enum DateTimeKnownEncoding
```

| Name | Value | Description |
|------|-------|-------------|
| rfc3339 | `"rfc3339"` | RFC 3339 standard. https://www.ietf.org/rfc/rfc3339.txt<br />Encode to string. |
| rfc7231 | `"rfc7231"` | RFC 7231 standard. https://www.ietf.org/rfc/rfc7231.txt<br />Encode to string. |
| unixTimestamp | `"unixTimestamp"` | Encode a datetime to a unix timestamp.<br />Unix timestamps are represented as an integer number of seconds since the Unix epoch and usually encoded as an int32. |


### `DurationKnownEncoding` {#DurationKnownEncoding}

Known encoding to use on duration
```typespec
enum DurationKnownEncoding
```

| Name | Value | Description |
|------|-------|-------------|
| ISO8601 | `"ISO8601"` | ISO8601 duration |
| seconds | `"seconds"` | Encode to integer or float |


### `Lifecycle` {#Lifecycle}

A visibility class for resource lifecycle phases.

These visibilities control whether a property is visible during the create, read, and update phases of a resource's
lifecycle.
```typespec
enum Lifecycle
```

| Name | Value | Description |
|------|-------|-------------|
| Create |  |  |
| Read |  |  |
| Update |  |  |
#### Examples

```typespec
model Dog {
 @visibility(Lifecycle.Read) id: int32;
 @visibility(Lifecycle.Create, Lifecycle.Update) secretName: string;
 name: string;
}
```

In this example, the `id` property is only visible during the read phase, and the `secretName` property is only visible
during the create and update phases. This means that the server will return the `id` property when returning a `Dog`,
but the client will not be able to set or update it. In contrast, the `secretName` property can be set when creating
or updating a `Dog`, but the server will never return it. The `name` property has no visibility modifiers and is
therefore visible in all phases.


### `boolean` {#boolean}

Boolean with `true` and `false` values.
```typespec
scalar boolean
```



### `bytes` {#bytes}

Represent a byte array
```typespec
scalar bytes
```



### `decimal` {#decimal}

A decimal number with any length and precision. This represent any `decimal` value possible.
It is commonly represented as `BigDecimal` in some languages.
```typespec
scalar decimal
```



### `decimal128` {#decimal128}

A 128-bit decimal number.
```typespec
scalar decimal128
```



### `duration` {#duration}

A duration/time period. e.g 5s, 10h
```typespec
scalar duration
```



### `float` {#float}

A number with decimal value
```typespec
scalar float
```



### `float32` {#float32}

A 32 bit floating point number. (`±1.5 x 10^−45` to `±3.4 x 10^38`)
```typespec
scalar float32
```



### `float64` {#float64}

A 64 bit floating point number. (`±5.0 × 10^−324` to `±1.7 × 10^308`)
```typespec
scalar float64
```



### `int16` {#int16}

A 16-bit integer. (`-32,768` to `32,767`)
```typespec
scalar int16
```



### `int32` {#int32}

A 32-bit integer. (`-2,147,483,648` to `2,147,483,647`)
```typespec
scalar int32
```



### `int64` {#int64}

A 64-bit integer. (`-9,223,372,036,854,775,808` to `9,223,372,036,854,775,807`)
```typespec
scalar int64
```



### `int8` {#int8}

A 8-bit integer. (`-128` to `127`)
```typespec
scalar int8
```



### `integer` {#integer}

A whole number. This represent any `integer` value possible.
It is commonly represented as `BigInteger` in some languages.
```typespec
scalar integer
```



### `numeric` {#numeric}

A numeric type
```typespec
scalar numeric
```



### `offsetDateTime` {#offsetDateTime}

A date and time in a particular time zone, e.g. "April 10th at 3:00am in PST"
```typespec
scalar offsetDateTime
```



### `plainDate` {#plainDate}

A date on a calendar without a time zone, e.g. "April 10th"
```typespec
scalar plainDate
```



### `plainTime` {#plainTime}

A time on a clock without a time zone, e.g. "3:00 am"
```typespec
scalar plainTime
```



### `safeint` {#safeint}

An integer that can be serialized to JSON (`−9007199254740991 (−(2^53 − 1))` to `9007199254740991 (2^53 − 1)` )
```typespec
scalar safeint
```



### `string` {#string}

A sequence of textual characters.
```typespec
scalar string
```



### `uint16` {#uint16}

A 16-bit unsigned integer (`0` to `65,535`)
```typespec
scalar uint16
```



### `uint32` {#uint32}

A 32-bit unsigned integer (`0` to `4,294,967,295`)
```typespec
scalar uint32
```



### `uint64` {#uint64}

A 64-bit unsigned integer (`0` to `18,446,744,073,709,551,615`)
```typespec
scalar uint64
```



### `uint8` {#uint8}

A 8-bit unsigned integer (`0` to `255`)
```typespec
scalar uint8
```



### `unixTimestamp32` {#unixTimestamp32}

Represent a 32-bit unix timestamp datetime with 1s of granularity.
It measures time by the number of seconds that have elapsed since 00:00:00 UTC on 1 January 1970.
```typespec
scalar unixTimestamp32
```



### `url` {#url}

Represent a URL string as described by https://url.spec.whatwg.org/
```typespec
scalar url
```



### `utcDateTime` {#utcDateTime}

An instant in coordinated universal time (UTC)"
```typespec
scalar utcDateTime
```


