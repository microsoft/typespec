---
id: built-in-decorators
title: Built-in Decorators
---

# Built-in decorators

Cadl comes built-in with a number of decorators that are useful for defining service APIs regardless of what protocol or language you're targeting.

[Documentation](#documentation-decorators)

- [@deprecated](#deprecated) - indicates that the decorator target has been deprecated.
- [@doc](#doc) - attach a documentation string. Works great with multi-line string literals.
- [@summary](#summary) - attach a documentation string, typically a short, single-line description.

[Service](#service-decorators)

- [@service](#service)

[String](#string-decorators)

- [@format](#format) - specify the data format hint for a string type
- [@pattern](#pattern) - set the pattern for a string using regular expression syntax
- [@knownValues](#knownvalues) - mark a string type with an enum that contains all known values
- [@secret](#secret) - mark a string as a secret value that should be treated carefully to avoid exposure
- [@minLength/@maxLength](#minlength-and-maxlength) - set the min and max lengths for strings

[Numeric](#numeric-decorators)

- [@minValue/@maxValue](#minvalue-and-maxvalue) - set the min and max values of number types

[Array](#array-decorators)

- [@minItems/@maxItems](#minitems-and-maxitems) - set the min and max number of items an array type can have

[Models](#model-decorators)

- [@error](#error) - specify a model is representing an error
- [@key](#key) - mark a model property as the key to identify instances of that type

[Debugging](#debugging-decorators)

- [@inspectType/@inspectTypeName](#inspecttype) - displays information about a type during compilation

[Misc](#misc-decorators)

- [@friendlyName](#friendlyname) - specify a friendly name to be used instead of declared model name
- [@tag](#tag) - attach a simple tag to a declaration
- [@visibility/@withVisibility](#visibility-decorators)
- [@projectedNames]({%doc "projected-names"%})

[Advanced](#advanced-decorators) _Those decorators shouldn't be need to be used directly, there is a template providing the functionality._

- [@withDefaultKeyVisibility](#withdefaultkeyvisibility) - set the visibility of key properties in a model if not already set.
- [@withOptionalProperties](#withoptionalproperties) - makes all properties of the target type optional.
- [@withoutDefaultValues](#withoutdefaultvalues) - removes all read-only properties from the target type.
- [@withoutOmittedProperties](#withoutomittedproperties) - removes all model properties that match a type.
- [@withUpdateableProperties](#withupdateableproperties) - remove all read-only properties from the target type

## Documentation decorators

### `@doc`

**Syntax:**

```cadl
@doc(text [, object])
```

`@doc` attaches a documentation string. Works great with multi-line string literals.

The first argument to `@doc` is a string, which may contain template parameters, enclosed in braces,
which are replaced with an attribute for the type (commonly "name") passed as the second (optional) argument.

`@doc` can be specified on any language element -- a model, an operation, a namespace, etc.

### `@summary`

**Syntax:**

```cadl
@summary(text [, object])
```

`@summary` attaches a documentation string. It is typically used to give a short, single-line
description, and can be used in combination with or instead of `@doc`.

The first argument to `@summary` is a string, which may contain template parameters, enclosed in braces,
which are replaced with an attribute for the type (commonly "name") passed as the second (optional) argument.

`@summary` can be specified on any language element -- a model, an operation, a namespace, etc.

### `@deprecated`

**Syntax:**

```cadl
@deprecated("<message>")
```

`@deprecated` marks a type as deprecated. It can be specified on any language element -- a model, an operation, a namespace, etc.

## Service decorators

### `@service`

Mark a namespace as service namespace.

**Syntax:**

```cadl
@service(serviceConfig?: {title?: string, version?: string})
```

**Parameter:**

- `serviceConfig`:
  - `title`: Service title. By default it would assume the namespace name is the service title.
  - `version`: Service version

**Examples:**

```ts
@service
namespace MyService
```

Optionally you can specify the title

```ts
@service({title: "My custom service"})
namespace MyService
```

And/Or the version of the service

```ts
@service({version: "1.2.3"})
namespace MyService
```

## String decorators

### `@format`

**Syntax:**

```cadl
@format(formatName)
```

`@format` - specify the data format hint for a string type

The first argument is a string that identifies the format that the string type expects. Any string
can be entered here, but a Cadl emitter must know how to interpret

For Cadl specs that will be used with an OpenAPI emitter, the OpenAPI specification describes
possible valid values for a [string type's format](https://github.com/OAI/OpenAPI-Specification/blob/3.0.3/versions/3.0.3.md#dataTypes).

`@format` can be applied to a type that extends from `string` or a `string`-typed model property.

### `@pattern`

**Syntax:**

```cadl
@pattern(regularExpressionText)
```

`@pattern` specifies a regular expression on a string property.

### `@knownValues`

**Syntax:**

```cadl
@knownValues(enumTypeReference)
```

`@knownValues` marks a string type with an enum that contains all known values

The first parameter is a reference to an enum type that enumerates all possible values that the
type accepts.

`@knownValues` can only be applied to model types that extend `string`.

Example:

```cadl
enum OperationStateValues {
  Running,
  Completed,
  Failed,
}

@knownValues(OperationStateValues)
model OperationState is string;
```

### `@secret`

**Syntax:**

```cadl
@secret
```

`@secret` mark a string as a secret value that should be treated carefully to avoid exposure

```cadl
@secret
model Password is string;
```

`@secret` can only be applied to string model;

### `@minLength` and `@maxLength`

```cadl
@minLength(<integer>)
@maxLength(<integer>)
model Name is string;
```

Specify the min and max length of the string.

```cadl
// Say that the name must be between 2 and 20 charchater long
@minLength(2)
@maxLength(20)
model Name is string;
```

The decorators can also be used on model properties

```cadl
model Dog {
  @minLength(2)
  @maxLength(20)
  name: string;
}
```

## Numeric decorators

### `@minValue` and `@maxValue`

```cadl
@minValue(<number>)
@maxValue(<number>)
model Name is int32;
```

Specify the min and max value for an integer or float.

```cadl
// Say that the Floor must be between 1 and 100
@minValue(1)
@maxValue(100)
model Floor is int32;
```

The decorators can also be used on model properties

```cadl
model Building {
  @minValue(1)
  @maxValue(100)
  floors: int32;
}
```

## Array decorators

### `@minItems` and `@maxItems`

```cadl
@minItems(<number>)
@maxItems(<number>)
model Names is string[];
```

Specify the min and max number of items in an array type.

```cadl
// Say that the the Names array type can have have between 1 and 3 items.
@minItems(1)
@maxItems(3)
model Names is string[];
```

The decorators can also be used on model properties

```cadl
model Person {
  @minItems(1)
  @maxItems(3)
  names: string[];
}
```

## Model decorators

### @error

**Syntax:**

```cadl
@error
```

`@error` - specify that this model is an error type

For HTTP API this can be used to represent a failure.

### `@key`

**Syntax:**

```cadl
@key([keyName])
```

`@key` - mark a model property as the key to identify instances of that type

The optional first argument accepts an alternate key name which may be used by emitters.
Otherwise, the name of the target property will be used.

`@key` can only be applied to model properties.

## Debugging decorators

### `@inspectType`

**Syntax:**

```cadl
@inspectType(message)
@inspectTypeName(message)
```

`@inspectType` displays information about a type during compilation.
`@inspectTypeName` displays information and name of type during compilation.
They can be specified on any language element -- a model, an operation, a namespace, etc.

## Misc decorators

### `@friendlyName`

**Syntax:**

```cadl
@friendlyName(string)
```

`@friendlyName` specifies how a templated type should name their instances. It takes a string literal coresponding the the name. `{name}` can be used to interpolate the value of the template parameter which can be passed as a 2nd parameter.

Example:

```cadl
@friendlyName("{name}List", T)
model List<T> {}

alias A = List<FooBar>; // Instance friendly name would be `FooBarList`
alias B = List<Person>; // Instance friendly name would be `PersonList`
```

### `@tag`

**Syntax:**

```cadl
@tag(text)
```

`@tag` attaches a tag to an operation, interface, or namespace. Multiple `@tag` decorators can be specified
to attach multiple tags to a Cadl element.

The argument to `@tag` is a string tag value.

### Visibility decorators

Additionally, the decorators `@withVisibility` and `@visibility` provide an extensible visibility framework that allows for defining a canonical model with fine-grained visibility flags and derived models that apply those flags. Flags can be any string value and so can be customized to your application. Also, `@visibility` can take multiple string flags to set multiple flags at once, and `@withVisibility` can take multiple string flags to filter on at once.

Consider the following example:

```cadl
model Dog {
  // the service will generate an ID, so you don't need to send it.
  @visibility("read") id: int32;
  // the service will store this secret name, but won't ever return it
  @visibility("write") secretName: string;
  // no flags are like specifying all flags at once, so in this case
  // equivalent to @visibility("read", "write")
  name: string;
}

// The spread operator will copy all the properties of Dog into ReadDog,
// and withVisibility will remove any that don't match the current
// visibility setting
@withVisibility("read")
model ReadDog {
  ...Dog;
}

@withVisibility("write")
model WriteDog {
  ...Dog;
}
```

Note that the OpenAPI v3 emitter applies visibility automatically without needing explicit `@withVisibility`. See [metadata]({%doc "http/operations"%}#metadata) for more information.

## Advanced decorators

Those decorators shouldn't be need to be used directly, there is a template providing the functionality.

### `@withDefaultKeyVisibility`

**Syntax:**

```cadl
@withDefaultKeyVisibility(string)
```

`@withDefaultKeyVisibility` - set the visibility of key properties in a model if not already set. The first argument accepts a string representing the desired default
visibility value.
If a key property already has a `visibility` decorator then the default visibility is not applied.

`@withDefaultKeyVisibility` can only be applied to model types.

### `@withOptionalProperties`

**Syntax:**

```cadl
@withOptionalProperties()
```

`@withOptionalProperties` makes all properties of the target type optional.

`@withOptionalProperties` can only be applied to model types.

### @withoutDefaultValues

**Syntax:**

```cadl
@withoutDefaultValues()
```

`@withoutDefaultValues` removes all read-only properties from the target type.

`@withoutDefaultValues` can only be applied to model types.

### @withoutOmittedProperties

**Syntax:**

```cadl
@withoutOmittedProperties(type)
```

`@withoutOmittedProperties` removes all model properties that match a type.

`@withoutOmittedProperties` can only be applied to model types.

### @withUpdateableProperties

**Syntax:**

```cadl
@withUpdateableProperties()
```

`@withUpdateableProperties` remove all read-only properties from the target type.

`@withUpdateableProperties` can only be applied to model types.
