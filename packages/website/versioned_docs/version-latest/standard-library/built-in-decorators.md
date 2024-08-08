---
title: "Built-in Decorators"
toc_min_heading_level: 2
toc_max_heading_level: 3
---
# Built-in Decorators
## TypeSpec
### `@deprecated` {#@deprecated}
:::warning
**Deprecated**: @deprecated decorator is deprecated. Use the `#deprecated` directive instead.
:::

Mark this type as deprecated.

NOTE: This decorator **should not** be used, use the `#deprecated` directive instead.
```typespec
@deprecated(message: valueof string)
```

#### Target

`unknown`

#### Parameters
| Name | Type | Description |
|------|------|-------------|
| message | [valueof `string`](#string) | Deprecation message. |

#### Examples

Use the `#deprecated` directive instead:

```typespec
#deprecated "Use ActionV2"
op Action<Result>(): Result;
```


### `@discriminator` {#@discriminator}

Specify the property to be used to discriminate this type.
```typespec
@discriminator(propertyName: valueof string)
```

#### Target

`Model | Union`

#### Parameters
| Name | Type | Description |
|------|------|-------------|
| propertyName | [valueof `string`](#string) | The property name to use for discrimination |

#### Examples

```typespec
@discriminator("kind")
union Pet{ cat: Cat, dog: Dog }

model Cat {kind: "cat", meow: boolean}
model Dog {kind: "dog", bark: boolean}
```

```typespec
@discriminator("kind")
model Pet{ kind: string }

model Cat extends Pet {kind: "cat", meow: boolean}
model Dog extends Pet  {kind: "dog", bark: boolean}
```


### `@doc` {#@doc}

Attach a documentation string.
```typespec
@doc(doc: valueof string, formatArgs?: {})
```

#### Target

`unknown`

#### Parameters
| Name | Type | Description |
|------|------|-------------|
| doc | [valueof `string`](#string) | Documentation string |
| formatArgs | `{}` | Record with key value pair that can be interpolated in the doc. |

#### Examples

```typespec
@doc("Represent a Pet available in the PetStore")
model Pet {}
```


### `@encode` {#@encode}

Specify how to encode the target type.
```typespec
@encode(encodingOrEncodeAs: Scalar | valueof string | EnumMember, encodedAs?: Scalar)
```

#### Target

`Scalar | ModelProperty`

#### Parameters
| Name | Type | Description |
|------|------|-------------|
| encodingOrEncodeAs | `Scalar` \| `valueof string \| EnumMember` | Known name of an encoding or a scalar type to encode as(Only for numeric types to encode as string). |
| encodedAs | `Scalar` | What target type is this being encoded as. Default to string. |

#### Examples
##### offsetDateTime encoded with rfc7231


```tsp
@encode("rfc7231")
scalar myDateTime extends offsetDateTime;
```

##### utcDateTime encoded with unixTimestamp


```tsp
@encode("unixTimestamp", int32)
scalar myDateTime extends unixTimestamp;
```

##### encode numeric type to string


```tsp
model Pet {
  @encode(string) id: int64;
}
```


### `@encodedName` {#@encodedName}

Provide an alternative name for this type when serialized to the given mime type.
```typespec
@encodedName(mimeType: valueof string, name: valueof string)
```

#### Target

`unknown`

#### Parameters
| Name | Type | Description |
|------|------|-------------|
| mimeType | [valueof `string`](#string) | Mime type this should apply to. The mime type should be a known mime type as described here https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Common_types without any suffix (e.g. `+json`) |
| name | [valueof `string`](#string) | Alternative name |

#### Examples

```typespec
model Certificate {
  @encodedName("application/json", "exp")
  @encodedName("application/xml", "expiry")
  expireAt: int32;
}
```

##### Invalid values


```typespec
@encodedName("application/merge-patch+json", "exp")
             ^ error cannot use subtype
```


### `@error` {#@error}

Specify that this model is an error type. Operations return error types when the operation has failed.
```typespec
@error
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


### `@errorsDoc` {#@errorsDoc}

Attach a documentation string to describe the error return types of an operation.
If an operation returns a union of success and errors it only describes the errors. See `@returnsDoc` for success documentation.
```typespec
@errorsDoc(doc: valueof string)
```

#### Target

`Operation`

#### Parameters
| Name | Type | Description |
|------|------|-------------|
| doc | [valueof `string`](#string) | Documentation string |

#### Examples

```typespec
@errorsDoc("Errors doc")
op get(): Pet | NotFound;
```


### `@example` {#@example}

Provide an example value for a data type.
```typespec
@example(example: valueof unknown, options?: valueof ExampleOptions)
```

#### Target

`Model | Enum | Scalar | Union | ModelProperty | UnionVariant`

#### Parameters
| Name | Type | Description |
|------|------|-------------|
| example | `valueof unknown` | Example value. |
| options | [valueof `ExampleOptions`](./built-in-data-types.md#ExampleOptions) | Optional metadata for the example. |

#### Examples

```tsp
@example(#{name: "Fluffy", age: 2})
model Pet {
 name: string;
 age: int32;
}
```


### `@format` {#@format}

Specify a known data format hint for this string type. For example `uuid`, `uri`, etc.
This differs from the `@pattern` decorator which is meant to specify a regular expression while `@format` accepts a known format name.
The format names are open ended and are left to emitter to interpret.
```typespec
@format(format: valueof string)
```

#### Target

`string | bytes | ModelProperty`

#### Parameters
| Name | Type | Description |
|------|------|-------------|
| format | [valueof `string`](#string) | format name. |

#### Examples

```typespec
@format("uuid")
scalar uuid extends string;
```


### `@friendlyName` {#@friendlyName}

Specifies how a templated type should name their instances.
```typespec
@friendlyName(name: valueof string, formatArgs?: unknown)
```

#### Target

`unknown`

#### Parameters
| Name | Type | Description |
|------|------|-------------|
| name | [valueof `string`](#string) | name the template instance should take |
| formatArgs | `unknown` | Model with key value used to interpolate the name |

#### Examples

```typespec
@friendlyName("{name}List", T)
model List<Item> {
  value: Item[];
  nextLink: string;
}
```


### `@inspectType` {#@inspectType}

A debugging decorator used to inspect a type.
```typespec
@inspectType(text: valueof string)
```

#### Target

`unknown`

#### Parameters
| Name | Type | Description |
|------|------|-------------|
| text | [valueof `string`](#string) | Custom text to log |



### `@inspectTypeName` {#@inspectTypeName}

A debugging decorator used to inspect a type name.
```typespec
@inspectTypeName(text: valueof string)
```

#### Target

`unknown`

#### Parameters
| Name | Type | Description |
|------|------|-------------|
| text | [valueof `string`](#string) | Custom text to log |



### `@key` {#@key}

Mark a model property as the key to identify instances of that type
```typespec
@key(altName?: valueof string)
```

#### Target

`ModelProperty`

#### Parameters
| Name | Type | Description |
|------|------|-------------|
| altName | [valueof `string`](#string) | Name of the property. If not specified, the decorated property name is used. |

#### Examples

```typespec
model Pet {
  @key id: string;
}
```


### `@knownValues` {#@knownValues}
:::warning
**Deprecated**: This decorator has been deprecated. Use a named union of string literals with a string variant to achieve the same result without a decorator.
:::

Provide a set of known values to a string type.
```typespec
@knownValues(values: Enum)
```

#### Target

`string | numeric | ModelProperty`

#### Parameters
| Name | Type | Description |
|------|------|-------------|
| values | `Enum` | Known values enum. |

#### Examples

```typespec
@knownValues(KnownErrorCode)
scalar ErrorCode extends string;

enum KnownErrorCode {
  NotFound,
  Invalid,
}
```


### `@list` {#@list}

Mark this operation as a `list` operation for resource types.
```typespec
@list(listedType?: Model)
```

#### Target

`Operation`

#### Parameters
| Name | Type | Description |
|------|------|-------------|
| listedType | `Model` | Optional type of the items in the list. |



### `@maxItems` {#@maxItems}

Specify the maximum number of items this array should have.
```typespec
@maxItems(value: valueof integer)
```

#### Target

`unknown[] | ModelProperty`

#### Parameters
| Name | Type | Description |
|------|------|-------------|
| value | [valueof `integer`](#integer) | Maximum number |

#### Examples

```typespec
@maxItems(5)
model Endpoints is string[];
```


### `@maxLength` {#@maxLength}

Specify the maximum length this string type should be.
```typespec
@maxLength(value: valueof integer)
```

#### Target

`string | ModelProperty`

#### Parameters
| Name | Type | Description |
|------|------|-------------|
| value | [valueof `integer`](#integer) | Maximum length |

#### Examples

```typespec
@maxLength(20)
scalar Username extends string;
```


### `@maxValue` {#@maxValue}

Specify the maximum value this numeric type should be.
```typespec
@maxValue(value: valueof numeric)
```

#### Target

`numeric | ModelProperty`

#### Parameters
| Name | Type | Description |
|------|------|-------------|
| value | [valueof `numeric`](#numeric) | Maximum value |

#### Examples

```typespec
@maxValue(200)
scalar Age is int32;
```


### `@maxValueExclusive` {#@maxValueExclusive}

Specify the maximum value this numeric type should be, exclusive of the given
value.
```typespec
@maxValueExclusive(value: valueof numeric)
```

#### Target

`numeric | ModelProperty`

#### Parameters
| Name | Type | Description |
|------|------|-------------|
| value | [valueof `numeric`](#numeric) | Maximum value |

#### Examples

```typespec
@maxValueExclusive(50)
scalar distance is float64;
```


### `@minItems` {#@minItems}

Specify the minimum number of items this array should have.
```typespec
@minItems(value: valueof integer)
```

#### Target

`unknown[] | ModelProperty`

#### Parameters
| Name | Type | Description |
|------|------|-------------|
| value | [valueof `integer`](#integer) | Minimum number |

#### Examples

```typespec
@minItems(1)
model Endpoints is string[];
```


### `@minLength` {#@minLength}

Specify the minimum length this string type should be.
```typespec
@minLength(value: valueof integer)
```

#### Target

`string | ModelProperty`

#### Parameters
| Name | Type | Description |
|------|------|-------------|
| value | [valueof `integer`](#integer) | Minimum length |

#### Examples

```typespec
@minLength(2)
scalar Username extends string;
```


### `@minValue` {#@minValue}

Specify the minimum value this numeric type should be.
```typespec
@minValue(value: valueof numeric)
```

#### Target

`numeric | ModelProperty`

#### Parameters
| Name | Type | Description |
|------|------|-------------|
| value | [valueof `numeric`](#numeric) | Minimum value |

#### Examples

```typespec
@minValue(18)
scalar Age is int32;
```


### `@minValueExclusive` {#@minValueExclusive}

Specify the minimum value this numeric type should be, exclusive of the given
value.
```typespec
@minValueExclusive(value: valueof numeric)
```

#### Target

`numeric | ModelProperty`

#### Parameters
| Name | Type | Description |
|------|------|-------------|
| value | [valueof `numeric`](#numeric) | Minimum value |

#### Examples

```typespec
@minValueExclusive(0)
scalar distance is float64;
```


### `@opExample` {#@opExample}

Provide example values for an operation's parameters and corresponding return type.
```typespec
@opExample(example: valueof OperationExample, options?: valueof ExampleOptions)
```

#### Target

`Operation`

#### Parameters
| Name | Type | Description |
|------|------|-------------|
| example | [valueof `OperationExample`](./built-in-data-types.md#OperationExample) | Example value. |
| options | [valueof `ExampleOptions`](./built-in-data-types.md#ExampleOptions) | Optional metadata for the example. |

#### Examples

```tsp
@example(#{parameters: #{name: "Fluffy", age: 2}, returnType: #{name: "Fluffy", age: 2, id: "abc"})
op createPet(pet: Pet): Pet;
```


### `@overload` {#@overload}

Specify this operation is an overload of the given operation.
```typespec
@overload(overloadbase: Operation)
```

#### Target

`Operation`

#### Parameters
| Name | Type | Description |
|------|------|-------------|
| overloadbase | `Operation` | Base operation that should be a union of all overloads |

#### Examples

```typespec
op upload(data: string | bytes, @header contentType: "text/plain" | "application/octet-stream"): void;
@overload(upload)
op uploadString(data: string, @header contentType: "text/plain" ): void;
@overload(upload)
op uploadBytes(data: bytes, @header contentType: "application/octet-stream"): void;
```


### `@parameterVisibility` {#@parameterVisibility}

Sets which visibilities apply to parameters for the given operation.
```typespec
@parameterVisibility(...visibilities: valueof string[])
```

#### Target

`Operation`

#### Parameters
| Name | Type | Description |
|------|------|-------------|
| visibilities | `valueof string[]` | List of visibility strings which apply to this operation. |



### `@pattern` {#@pattern}

Specify the the pattern this string should respect using simple regular expression syntax.
The following syntax is allowed: alternations (`|`), quantifiers (`?`, `*`, `+`, and `{ }`), wildcard (`.`), and grouping parentheses.
Advanced features like look-around, capture groups, and references are not supported.

This decorator may optionally provide a custom validation _message_. Emitters may choose to use the message to provide
context when pattern validation fails. For the sake of consistency, the message should be a phrase that describes in
plain language what sort of content the pattern attempts to validate. For example, a complex regular expression that
validates a GUID string might have a message like "Must be a valid GUID."
```typespec
@pattern(pattern: valueof string, validationMessage?: valueof string)
```

#### Target

`string | bytes | ModelProperty`

#### Parameters
| Name | Type | Description |
|------|------|-------------|
| pattern | [valueof `string`](#string) | Regular expression. |
| validationMessage | [valueof `string`](#string) | Optional validation message that may provide context when validation fails. |

#### Examples

```typespec
@pattern("[a-z]+", "Must be a string consisting of only lower case letters and of at least one character.")
scalar LowerAlpha extends string;
```


### `@projectedName` {#@projectedName}
:::warning
**Deprecated**: Use `@encodedName` instead for changing the name over the wire.
:::

DEPRECATED: Use `@encodedName` instead.

Provide an alternative name for this type.
```typespec
@projectedName(targetName: valueof string, projectedName: valueof string)
```

#### Target

`unknown`

#### Parameters
| Name | Type | Description |
|------|------|-------------|
| targetName | [valueof `string`](#string) | Projection target |
| projectedName | [valueof `string`](#string) | Alternative name |

#### Examples

```typespec
model Certificate {
  @projectedName("json", "exp")
  expireAt: int32;
}
```


### `@returnsDoc` {#@returnsDoc}

Attach a documentation string to describe the successful return types of an operation.
If an operation returns a union of success and errors it only describes the success. See `@errorsDoc` for error documentation.
```typespec
@returnsDoc(doc: valueof string)
```

#### Target

`Operation`

#### Parameters
| Name | Type | Description |
|------|------|-------------|
| doc | [valueof `string`](#string) | Documentation string |

#### Examples

```typespec
@returnsDoc("Returns doc")
op get(): Pet | NotFound;
```


### `@returnTypeVisibility` {#@returnTypeVisibility}

Sets which visibilities apply to the return type for the given operation.
```typespec
@returnTypeVisibility(...visibilities: valueof string[])
```

#### Target

`Operation`

#### Parameters
| Name | Type | Description |
|------|------|-------------|
| visibilities | `valueof string[]` | List of visibility strings which apply to this operation. |



### `@secret` {#@secret}

Mark this string as a secret value that should be treated carefully to avoid exposure
```typespec
@secret
```

#### Target

`string | ModelProperty`

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
@service(options?: ServiceOptions)
```

#### Target

`Namespace`

#### Parameters
| Name | Type | Description |
|------|------|-------------|
| options | [`ServiceOptions`](./built-in-data-types.md#ServiceOptions) | Optional configuration for the service. |

#### Examples

```typespec
@service
namespace PetStore;
```

##### Setting service title

```typespec
@service({title: "Pet store"})
namespace PetStore;
```

##### Setting service version

```typespec
@service({version: "1.0"})
namespace PetStore;
```


### `@summary` {#@summary}

Typically a short, single-line description.
```typespec
@summary(summary: valueof string)
```

#### Target

`unknown`

#### Parameters
| Name | Type | Description |
|------|------|-------------|
| summary | [valueof `string`](#string) | Summary string. |

#### Examples

```typespec
@summary("This is a pet")
model Pet {}
```


### `@tag` {#@tag}

Attaches a tag to an operation, interface, or namespace. Multiple `@tag` decorators can be specified to attach multiple tags to a TypeSpec element.
```typespec
@tag(tag: valueof string)
```

#### Target

`Namespace | Interface | Operation`

#### Parameters
| Name | Type | Description |
|------|------|-------------|
| tag | [valueof `string`](#string) | Tag value |



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

See also: [Automatic visibility](https://typespec.io/docs/libraries/http/operations#automatic-visibility)
```typespec
@visibility(...visibilities: valueof string[])
```

#### Target

`ModelProperty`

#### Parameters
| Name | Type | Description |
|------|------|-------------|
| visibilities | `valueof string[]` | List of visibilities which apply to this property. |

#### Examples

```typespec
model Dog {
  // the service will generate an ID, so you don't need to send it.
  @visibility("read") id: int32;
  // the service will store this secret name, but won't ever return it
  @visibility("create", "update") secretName: string;
  // the regular name is always present
  name: string;
}
```


### `@withDefaultKeyVisibility` {#@withDefaultKeyVisibility}

Set the visibility of key properties in a model if not already set.
```typespec
@withDefaultKeyVisibility(visibility: valueof string)
```

#### Target

`Model`

#### Parameters
| Name | Type | Description |
|------|------|-------------|
| visibility | [valueof `string`](#string) | The desired default visibility value. If a key property already has a `visibility` decorator then the default visibility is not applied. |



### `@withOptionalProperties` {#@withOptionalProperties}

Returns the model with required properties removed.
```typespec
@withOptionalProperties
```

#### Target

`Model`

#### Parameters
None



### `@withoutDefaultValues` {#@withoutDefaultValues}

Returns the model with any default values removed.
```typespec
@withoutDefaultValues
```

#### Target

`Model`

#### Parameters
None



### `@withoutOmittedProperties` {#@withoutOmittedProperties}

Returns the model with the given properties omitted.
```typespec
@withoutOmittedProperties(omit: string | Union)
```

#### Target

`Model`

#### Parameters
| Name | Type | Description |
|------|------|-------------|
| omit | `string \| Union` | List of properties to omit |



### `@withPickedProperties` {#@withPickedProperties}

Returns the model with only the given properties included.
```typespec
@withPickedProperties(pick: string | Union)
```

#### Target

`Model`

#### Parameters
| Name | Type | Description |
|------|------|-------------|
| pick | `string \| Union` | List of properties to include |



### `@withUpdateableProperties` {#@withUpdateableProperties}

Returns the model with non-updateable properties removed.
```typespec
@withUpdateableProperties
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

See also: [Automatic visibility](https://typespec.io/docs/libraries/http/operations#automatic-visibility)

When using an emitter that applies visibility automatically, it is generally
not necessary to use this decorator.
```typespec
@withVisibility(...visibilities: valueof string[])
```

#### Target

`Model`

#### Parameters
| Name | Type | Description |
|------|------|-------------|
| visibilities | `valueof string[]` | List of visibilities which apply to this property. |

#### Examples

```typespec
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

