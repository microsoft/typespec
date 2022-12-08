## `@format`

Specify a known data format hint for this string type. For example `uuid`, `uri`, etc.
This differ from the


```cadl
dec format (target: undefined, format: string) 
```

Target: `undefined`
Parameters:
-`format` format name.


### Examples:

```cadl
@format("uuid")
scalar uuid extends string;
```
## `@deprecated`

Mark this type as deprecated


```cadl
dec deprecated (target: undefined, message: string) 
```

Target: `undefined`
Parameters:
-`message` Deprecation message.

```cadl
@deprecated("Use ActionV2")
op Action<T>(): T;
```


### Examples:

## `@doc`

Attach a documentation string.


```cadl
dec doc (target: undefined, doc: string, formatArgs?: object) 
```

Target: `undefined`
Parameters:
-`doc` Documentation string

-`formatArgs` (optional) Record with key value pair that can be interpolated in the doc.


### Examples:

```cadl
@doc("Represent a Pet available in the PetStore")
model Pet {}
```
## `@withUpdateableProperties`

## `@withoutOmittedProperties`

## `@withoutDefaultValues`

## `@withDefaultKeyVisibility`

## `@summary`

Typically a short, single-line description.


```cadl
dec summary (target: undefined, summary: string) 
```

Target: `undefined`
Parameters:
-`summary` Summary string.


### Examples:

```cadl
@summary("This is a pet")
model Pet {}
```
## `@service`

Mark this namespace as describing a service and configure service properties.


```cadl
dec service (target: Namespace, options?: ServiceOptions) 
```

Target: `Namespace`
Parameters:
-`options` (optional) Optional configuration for the service.


### Examples:

```cadl
@service
namespace PetStore;
```
Setting service title
```cadl
@service({title: "Pet store"})
namespace PetStore;
```
Setting service version
```cadl
@service({version: "1.0"})
namespace PetStore;
```
## `@error`

Specify that this model is an error type. Operations return error types when the operation has failed.


```cadl
dec error (target: object) 
```

Target: `object`
Parameters:

### Examples:

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
dec pattern (target: undefined, pattern: string) 
```

Target: `undefined`
Parameters:
-`pattern` Regular expression.


### Examples:

```cadl
@pattern("[a-z]+")
scalar LowerAlpha extends string;
```
## `@minLength`

Specify the minimum length this string type should be.


```cadl
dec minLength (target: undefined, value: integer) 
```

Target: `undefined`
Parameters:
-`value` Minimum length


### Examples:

```cadl
@minLength(2)
scalar Username extends string;
```
## `@maxLength`

Specify the maximum length this string type should be.


```cadl
dec maxLength (target: undefined, value: integer) 
```

Target: `undefined`
Parameters:
-`value` Maximum length


### Examples:

```cadl
@maxLength(20)
scalar Username extends string;
```
## `@minItems`

Specify the minimum number of items this array should have.


```cadl
dec minItems (target: undefined, value: integer) 
```

Target: `undefined`
Parameters:
-`value` Minimum number


### Examples:

```cadl
@minItems(1)
model Endpoints is string[];
```
## `@maxItems`

Specify the maximum number of items this array should have.


```cadl
dec maxItems (target: undefined, value: integer) 
```

Target: `undefined`
Parameters:
-`value` Maximum number


### Examples:

```cadl
@maxItems(5)
model Endpoints is string[];
```
## `@minValue`

Specific the minimum value this numeric type should be.


```cadl
dec minValue (target: undefined, value: numeric) 
```

Target: `undefined`
Parameters:
-`value` Minimum value


### Examples:

```cadl
@maxValue(18)
scalar Age is int32;
```
## `@maxValue`

Specific the maximum value this numeric type should be.


```cadl
dec maxValue (target: undefined, value: numeric) 
```

Target: `undefined`
Parameters:
-`value` Maximum value


### Examples:

```cadl
@maxValue(200)
scalar Age is int32;
```
## `@secret`

Mark this string as a secret value that should be treated carefully to avoid exposure


```cadl
dec secret (target: undefined) 
```

Target: `undefined`
Parameters:

### Examples:

```cadl
@secret
scalar Password is string;
```
## `@tag`

Attaches a tag to an operation, interface, or namespace. Multiple `@tag` decorators can be specified to attach multiple tags to a Cadl element.


```cadl
dec tag (target: undefined, tag: string) 
```

Target: `undefined`
Parameters:
-`tag` Tag value


### Examples:

## `@friendlyName`

Specifies how a templated type should name their instances.


```cadl
dec friendlyName (target: undefined, name: string) 
```

Target: `undefined`
Parameters:
-`name` name the template instance should take


### Examples:

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
dec knownValues (target: undefined, values: Enum) 
```

Target: `undefined`
Parameters:
-`values` Known values enum.


### Examples:

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
dec key (target: ModelProperty) 
```

Target: `ModelProperty`
Parameters:

### Examples:

```cadl
model Pet {
@key id: string;
}
```
## `@overload`

Specify this operation is an overload of the given operation.


```cadl
dec overload (target: Operation, overloadbase: Operation) 
```

Target: `Operation`
Parameters:
-`overloadbase` Base operation that should be a union of all overloads


### Examples:

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
dec projectedName (target: undefined, targetName: string, projectedName: string) 
```

Target: `undefined`
Parameters:
-`targetName` Projection target

-`projectedName` Alternative name


### Examples:

```cadl
model Certificate {
@projectedName("json", "exp")
expireAt: int32;
}
```
## `@discriminator`

Specify the property to be used to discriminate this type.


```cadl
dec discriminator (target: undefined) 
```

Target: `undefined`
Parameters:

### Examples:

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
dec visibility (target: ModelProperty, ...visibilities: string[]) 
```

Target: `ModelProperty`
Parameters:
-`visibilities` Visibilities that applies to the target properties.


### Examples:

## `@withVisibility`

Will only select properties with the matching visibilities.


```cadl
dec withVisibility (target: object) 
```

Target: `object`
Parameters:

### Examples:

## `@inspectType`

## `@inspectTypeName`

