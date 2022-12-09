# Decorators

## `@format`

Specify a known data format hint for this string type. For example `uuid`, `uri`, etc.
This differ from the

```cadl
dec format(target: Cadl.string | Cadl.bytes | Cadl.Reflection.ModelProperty, format: Cadl.string)
```

### Target

`union Cadl.string | Cadl.bytes | Cadl.Reflection.ModelProperty`

### Parameters

| Name   | Type                 | Description  |
| ------ | -------------------- | ------------ |
| format | `scalar Cadl.string` | format name. |

### Examples

```cadl
@format("uuid")
scalar uuid extends string;
```

## `@deprecated`

Mark this type as deprecated

```cadl
dec deprecated(target: unknown, message: Cadl.string)
```

### Target

`(intrinsic) unknown`

### Parameters

| Name    | Type                 | Description          |
| ------- | -------------------- | -------------------- |
| message | `scalar Cadl.string` | Deprecation message. |

### Examples

```cadl
@deprecated("Use ActionV2")
op Action<T>(): T;
```

## `@doc`

Attach a documentation string.

```cadl
dec doc(target: unknown, doc: Cadl.string, formatArgs?: Cadl.object)
```

### Target

`(intrinsic) unknown`

### Parameters

| Name       | Type                 | Description                                                     |
| ---------- | -------------------- | --------------------------------------------------------------- |
| doc        | `scalar Cadl.string` | Documentation string                                            |
| formatArgs | `model Cadl.object`  | Record with key value pair that can be interpolated in the doc. |

### Examples

```cadl
@doc("Represent a Pet available in the PetStore")
model Pet {}
```

## `@withUpdateableProperties`

```cadl
dec withUpdateableProperties(target: Cadl.object)
```

### Target

`model Cadl.object`

### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

### Examples

## `@withoutOmittedProperties`

```cadl
dec withoutOmittedProperties(target: Cadl.object, omit: Cadl.string | Cadl.Reflection.Union)
```

### Target

`model Cadl.object`

### Parameters

| Name | Type               | Description            |
| ---- | ------------------ | ---------------------- | --- |
| omit | `union Cadl.string | Cadl.Reflection.Union` |     |

### Examples

## `@withoutDefaultValues`

```cadl
dec withoutDefaultValues(target: Cadl.object)
```

### Target

`model Cadl.object`

### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

### Examples

## `@withDefaultKeyVisibility`

```cadl
dec withDefaultKeyVisibility(target: Cadl.object, visibility: unknown)
```

### Target

`model Cadl.object`

### Parameters

| Name       | Type                  | Description |
| ---------- | --------------------- | ----------- |
| visibility | `(intrinsic) unknown` |             |

### Examples

## `@summary`

Typically a short, single-line description.

```cadl
dec summary(target: unknown, summary: Cadl.string)
```

### Target

`(intrinsic) unknown`

### Parameters

| Name    | Type                 | Description     |
| ------- | -------------------- | --------------- |
| summary | `scalar Cadl.string` | Summary string. |

### Examples

```cadl
@summary("This is a pet")
model Pet {}
```

## `@service`

Mark this namespace as describing a service and configure service properties.

```cadl
dec service(target: Cadl.Reflection.Namespace, options?: Cadl.ServiceOptions)
```

### Target

`model Cadl.Reflection.Namespace`

### Parameters

| Name    | Type                        | Description                             |
| ------- | --------------------------- | --------------------------------------- |
| options | `model Cadl.ServiceOptions` | Optional configuration for the service. |

### Examples

```cadl
@service
namespace PetStore;
```

#### Setting service title

```cadl
@service({title: "Pet store"})
namespace PetStore;
```

#### Setting service version

```cadl
@service({version: "1.0"})
namespace PetStore;
```

## `@error`

Specify that this model is an error type. Operations return error types when the operation has failed.

```cadl
dec error(target: Cadl.object)
```

### Target

`model Cadl.object`

### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

### Examples

```cadl
@error
model PetStoreError {
code: string;
message: string;
}
```

## `@pattern`

Specify the the pattern this string should respect using simple regular expression syntax.
The following syntax is allowed: alternations (`|`), quantifiers (`?`, `*`, `+`, and `{ }`), wildcard (`.`), and grouping parentheses.
Advanced features like look-around, capture groups, and references are not supported.

```cadl
dec pattern(target: Cadl.string | Cadl.bytes | Cadl.Reflection.ModelProperty, pattern: Cadl.string)
```

### Target

`union Cadl.string | Cadl.bytes | Cadl.Reflection.ModelProperty`

### Parameters

| Name    | Type                 | Description         |
| ------- | -------------------- | ------------------- |
| pattern | `scalar Cadl.string` | Regular expression. |

### Examples

```cadl
@pattern("[a-z]+")
scalar LowerAlpha extends string;
```

## `@minLength`

Specify the minimum length this string type should be.

```cadl
dec minLength(target: Cadl.string | Cadl.Reflection.ModelProperty, value: Cadl.integer)
```

### Target

`union Cadl.string | Cadl.Reflection.ModelProperty`

### Parameters

| Name  | Type                  | Description    |
| ----- | --------------------- | -------------- |
| value | `scalar Cadl.integer` | Minimum length |

### Examples

```cadl
@minLength(2)
scalar Username extends string;
```

## `@maxLength`

Specify the maximum length this string type should be.

```cadl
dec maxLength(target: Cadl.string | Cadl.Reflection.ModelProperty, value: Cadl.integer)
```

### Target

`union Cadl.string | Cadl.Reflection.ModelProperty`

### Parameters

| Name  | Type                  | Description    |
| ----- | --------------------- | -------------- |
| value | `scalar Cadl.integer` | Maximum length |

### Examples

```cadl
@maxLength(20)
scalar Username extends string;
```

## `@minItems`

Specify the minimum number of items this array should have.

```cadl
dec minItems(target: unknown[] | Cadl.Reflection.ModelProperty, value: Cadl.integer)
```

### Target

`union unknown[] | Cadl.Reflection.ModelProperty`

### Parameters

| Name  | Type                  | Description    |
| ----- | --------------------- | -------------- |
| value | `scalar Cadl.integer` | Minimum number |

### Examples

```cadl
@minItems(1)
model Endpoints is string[];
```

## `@maxItems`

Specify the maximum number of items this array should have.

```cadl
dec maxItems(target: unknown[] | Cadl.Reflection.ModelProperty, value: Cadl.integer)
```

### Target

`union unknown[] | Cadl.Reflection.ModelProperty`

### Parameters

| Name  | Type                  | Description    |
| ----- | --------------------- | -------------- |
| value | `scalar Cadl.integer` | Maximum number |

### Examples

```cadl
@maxItems(5)
model Endpoints is string[];
```

## `@minValue`

Specific the minimum value this numeric type should be.

```cadl
dec minValue(target: Cadl.numeric | Cadl.Reflection.ModelProperty, value: Cadl.numeric)
```

### Target

`union Cadl.numeric | Cadl.Reflection.ModelProperty`

### Parameters

| Name  | Type                  | Description   |
| ----- | --------------------- | ------------- |
| value | `scalar Cadl.numeric` | Minimum value |

### Examples

```cadl
@maxValue(18)
scalar Age is int32;
```

## `@maxValue`

Specific the maximum value this numeric type should be.

```cadl
dec maxValue(target: Cadl.numeric | Cadl.Reflection.ModelProperty, value: Cadl.numeric)
```

### Target

`union Cadl.numeric | Cadl.Reflection.ModelProperty`

### Parameters

| Name  | Type                  | Description   |
| ----- | --------------------- | ------------- |
| value | `scalar Cadl.numeric` | Maximum value |

### Examples

```cadl
@maxValue(200)
scalar Age is int32;
```

## `@secret`

Mark this string as a secret value that should be treated carefully to avoid exposure

```cadl
dec secret(target: Cadl.string | Cadl.Reflection.ModelProperty)
```

### Target

`union Cadl.string | Cadl.Reflection.ModelProperty`

### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

### Examples

```cadl
@secret
scalar Password is string;
```

## `@tag`

Attaches a tag to an operation, interface, or namespace. Multiple `@tag` decorators can be specified to attach multiple tags to a Cadl element.

```cadl
dec tag(target: Cadl.Reflection.Namespace | Cadl.Reflection.Interface | Cadl.Reflection.Operation, tag: Cadl.string)
```

### Target

`union Cadl.Reflection.Namespace | Cadl.Reflection.Interface | Cadl.Reflection.Operation`

### Parameters

| Name | Type                 | Description |
| ---- | -------------------- | ----------- |
| tag  | `scalar Cadl.string` | Tag value   |

### Examples

## `@friendlyName`

Specifies how a templated type should name their instances.

```cadl
dec friendlyName(target: unknown, name: Cadl.string, formatArgs?: unknown)
```

### Target

`(intrinsic) unknown`

### Parameters

| Name       | Type                  | Description                            |
| ---------- | --------------------- | -------------------------------------- |
| name       | `scalar Cadl.string`  | name the template instance should take |
| formatArgs | `(intrinsic) unknown` |                                        |

### Examples

```cadl
@friendlyName("{name}List", T)
model List<T> {
value: T[];
nextLink: string;
}
```

## `@knownValues`

Provide a set of known values to a string type.

```cadl
dec knownValues(target: Cadl.string | Cadl.numeric | Cadl.Reflection.ModelProperty, values: Cadl.Reflection.Enum)
```

### Target

`union Cadl.string | Cadl.numeric | Cadl.Reflection.ModelProperty`

### Parameters

| Name   | Type                         | Description        |
| ------ | ---------------------------- | ------------------ |
| values | `model Cadl.Reflection.Enum` | Known values enum. |

### Examples

```cadl
@knownValues(KnownErrorCode)
scalar ErrorCode extends string;

enum KnownErrorCode {
NotFound,
Invalid,
}
```

## `@key`

Mark a model property as the key to identify instances of that type

```cadl
dec key(target: Cadl.Reflection.ModelProperty, altName?: Cadl.string)
```

### Target

`model Cadl.Reflection.ModelProperty`

### Parameters

| Name    | Type                 | Description |
| ------- | -------------------- | ----------- |
| altName | `scalar Cadl.string` |             |

### Examples

```cadl
model Pet {
@key id: string;
}
```

## `@overload`

Specify this operation is an overload of the given operation.

```cadl
dec overload(target: Cadl.Reflection.Operation, overloadbase: Cadl.Reflection.Operation)
```

### Target

`model Cadl.Reflection.Operation`

### Parameters

| Name         | Type                              | Description                                            |
| ------------ | --------------------------------- | ------------------------------------------------------ |
| overloadbase | `model Cadl.Reflection.Operation` | Base operation that should be a union of all overloads |

### Examples

```cadl
op upload(data: string | bytes, @header contentType: "text/plain" | "application/octet-stream"): void;
@overload(upload)
op uploadString(data: string, @header contentType: "text/plain" ): void;
@overload(upload)
op uploadBytes(data: bytes, @header contentType: "application/octet-stream"): void;
```

## `@projectedName`

Provide an alternative name for this type.

```cadl
dec projectedName(target: unknown, targetName: Cadl.string, projectedName: Cadl.string)
```

### Target

`(intrinsic) unknown`

### Parameters

| Name          | Type                 | Description       |
| ------------- | -------------------- | ----------------- |
| targetName    | `scalar Cadl.string` | Projection target |
| projectedName | `scalar Cadl.string` | Alternative name  |

### Examples

```cadl
model Certificate {
@projectedName("json", "exp")
expireAt: int32;
}
```

## `@discriminator`

Specify the property to be used to discriminate this type.

```cadl
dec discriminator(target: Cadl.object | Cadl.Reflection.Union, propertyName: Cadl.string)
```

### Target

`union Cadl.object | Cadl.Reflection.Union`

### Parameters

| Name         | Type                 | Description |
| ------------ | -------------------- | ----------- |
| propertyName | `scalar Cadl.string` |             |

### Examples

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

## `@visibility`

Provide an extensible visibility framework that allows for defining a canonical model with fine-grained visibility flags and derived models that apply those flags.
Flags can be any string value and so can be customized to your application.

```cadl
dec visibility(target: Cadl.Reflection.ModelProperty, ...visibilities: Cadl.string[])
```

### Target

`model Cadl.Reflection.ModelProperty`

### Parameters

| Name         | Type                  | Description                                         |
| ------------ | --------------------- | --------------------------------------------------- |
| visibilities | `model Cadl.string[]` | Visibilities that applies to the target properties. |

### Examples

## `@withVisibility`

Will only select properties with the matching visibilities.

```cadl
dec withVisibility(target: Cadl.object, ...visibilities: Cadl.string[])
```

### Target

`model Cadl.object`

### Parameters

| Name         | Type                  | Description |
| ------------ | --------------------- | ----------- |
| visibilities | `model Cadl.string[]` |             |

### Examples

## `@inspectType`

```cadl
dec inspectType(target: unknown, text: Cadl.string)
```

### Target

`(intrinsic) unknown`

### Parameters

| Name | Type                 | Description |
| ---- | -------------------- | ----------- |
| text | `scalar Cadl.string` |             |

### Examples

## `@inspectTypeName`

```cadl
dec inspectTypeName(target: unknown, text: Cadl.string)
```

### Target

`(intrinsic) unknown`

### Parameters

| Name | Type                 | Description |
| ---- | -------------------- | ----------- |
| text | `scalar Cadl.string` |             |

### Examples
