---
title: "Built-in Data types"
toc_min_heading_level: 2
toc_max_heading_level: 3
---
# Data types
## TypeSpec
### `Array` {#Array}




```typespec
model Array<T>
```

#### Template Parameters
| Name | Description |
|------|-------------|
| T | The type of the array elements |



### `DefaultKeyVisibility` {#DefaultKeyVisibility}

Applies a visibility setting to a collection of properties.

```typespec
model DefaultKeyVisibility<T, Visibility>
```

#### Template Parameters
| Name | Description |
|------|-------------|
| T | An object whose properties are spread. |
| Visibility | The visibility to apply to all properties. |



### `object` {#object}

Represent a model

```typespec
model object
```



### `OmitDefaults` {#OmitDefaults}

Represents a collection of properties with default values omitted.

```typespec
model OmitDefaults<T>
```

#### Template Parameters
| Name | Description |
|------|-------------|
| T | An object whose spread property defaults are all omitted. |



### `OmitProperties` {#OmitProperties}

Represents a collection of omitted properties.

```typespec
model OmitProperties<T, TKeys>
```

#### Template Parameters
| Name | Description |
|------|-------------|
| T | An object whose properties are spread. |
| TKeys | The property keys to omit. |



### `OptionalProperties` {#OptionalProperties}

Represents a collection of optional properties.

```typespec
model OptionalProperties<T>
```

#### Template Parameters
| Name | Description |
|------|-------------|
| T | An object whose spread properties are all optional. |



### `Record` {#Record}




```typespec
model Record<T>
```

#### Template Parameters
| Name | Description |
|------|-------------|
| T | The type of the properties |



### `ServiceOptions` {#ServiceOptions}

Service options.

```typespec
model ServiceOptions
```



### `UpdateableProperties` {#UpdateableProperties}

Represents a collection of updateable properties.

```typespec
model UpdateableProperties<T>
```

#### Template Parameters
| Name | Description |
|------|-------------|
| T | An object whose spread properties are all updateable. |



### `BytesKnownEncoding` {#BytesKnownEncoding}

Known encoding to use on bytes

```typespec
enum BytesKnownEncoding
```



### `DateTimeKnownEncoding` {#DateTimeKnownEncoding}

Known encoding to use on utcDateTime or offsetDateTime

```typespec
enum DateTimeKnownEncoding
```



### `DurationKnownEncoding` {#DurationKnownEncoding}

Known encoding to use on duration

```typespec
enum DurationKnownEncoding
```



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

A decimal number with any length and precision.

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

A 32 bit floating point number. (`±5.0 × 10^−324` to `±1.7 × 10^308`)

```typespec
scalar float32
```



### `float64` {#float64}

A 32 bit floating point number. (`±1.5 x 10^−45` to `±3.4 x 10^38`)

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

A whole number

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


