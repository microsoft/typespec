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

## Scalar initializers

Scalars can be declared with an initializer for creating specific scalar values based on other values. For example:

```typespec
scalar ipv4 extends string {
  init fromInt(value: uint32);
}

const homeIp = ipv4.fromInt(2130706433);
```

Initializers do not have any runtime code associated with them. Instead, they merely record the scalar initializer invoked along with the arguments passed so that emitters can construct the proper value when needed.

### Date/time initializers

The built-in date and time scalars provide initializers for common use cases:

#### `fromISO`: create from ISO 8601 string

```typespec
const date = plainDate.fromISO("2024-05-06");
const time = plainTime.fromISO("12:34");
const timestamp = utcDateTime.fromISO("2024-05-06T12:20:00Z");
const offsetTime = offsetDateTime.fromISO("2024-05-06T12:20:00-07:00");
const period = duration.fromISO("P1Y1D");
```

#### `now`: current date/time

The `now()` initializer indicates that the current date or time should be used. Emitters interpret this as the appropriate runtime value (e.g., database `CURRENT_TIMESTAMP`, JavaScript `Date.now()`, etc.).

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
