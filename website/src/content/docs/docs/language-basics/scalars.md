---
title: Scalars
description: "Language basics - custom scalars"
llmstxt: true
---

Scalars are simple types that don't have any fields. Examples of these include `string`, `int32`, `boolean`, and so on.

You can declare a scalar by using the `scalar` keyword. Its name must be an [`identifier`](./identifiers.md).

```typespec
scalar ternary;
```

## Extending a scalar

You can create a new scalar that extends an existing one by using the `extends` keyword.

```typespec
scalar Password extends string;
```

## Scalars with template parameters

Scalars can also support template parameters. These template parameters are primarily used for decorators.

```typespec
@doc(Type)
scalar Unreal<Type extends valueof string>;
```

## Scalar constructors

Scalars can be declared with a constructor for creating specific scalar values based on other values. For example:

```typespec
scalar ipv4 extends string {
  init fromInt(value: uint32);
}

const homeIp = ipv4.fromInt(2130706433);
```

Constructors do not have any runtime code associated with them. Instead, they merely record the scalar constructor invoked along with the arguments passed so that emitters can construct the proper value when needed.

### Date/time constructors

The built-in date and time scalars provide constructors for common use cases:

#### `fromISO`: create from ISO 8601 string

```typespec
const date = plainDate.fromISO("2024-05-06");
const time = plainTime.fromISO("12:34");
const timestamp = utcDateTime.fromISO("2024-05-06T12:20:00Z");
const offsetTime = offsetDateTime.fromISO("2024-05-06T12:20:00-07:00");
const period = duration.fromISO("P1Y1D");
```

#### `now`: current date/time

The `now()` constructor indicates that the current date or time should be used. Emitters interpret this as the appropriate runtime value (e.g., database `CURRENT_TIMESTAMP`, JavaScript `Date.now()`, etc.).

```typespec
model Record {
  createdAt: utcDateTime = utcDateTime.now();
  updatedAt: utcDateTime = utcDateTime.now();
}

model Event {
  date: plainDate = plainDate.now();
  time: plainTime = plainTime.now();
}
```

## In expression position

:::warning
Declaration expressions are an experimental TypeSpec feature. Using a `model`, `enum`, `union`, or `scalar` declaration in expression position yields an `experimental-feature` warning. Enable them without the warning by adding `declaration-expressions` to the `features` list in your `tspconfig.yaml`:

```yaml
kind: project
features:
  - declaration-expressions
```

:::

The `scalar` keyword can also be used anywhere a type expression is expected — for example as an alias value, a property type, a decorator or template argument, or a tuple element.

```typespec
model Measurement {
  // anonymous scalar in expression position
  temperature: scalar extends float64;

  // named scalar in expression position
  distance: scalar Meters extends float64;
}
```

A scalar used in expression position is marked as an expression and is **not** registered in the enclosing namespace, even when it is given a name. The name is kept on the resulting type for display purposes only — it cannot be referenced elsewhere.

You can apply [decorators](./decorators.md) and doc comments to the declaration inline, and augment it through a navigation reference such as `::type`.
