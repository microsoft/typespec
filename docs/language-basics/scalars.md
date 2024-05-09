---
title: Scalars
---

# Scalars

Scalars are simple types that don't have any fields. Examples of these include `string`, `int32`, `boolean`, and so on.

You can declare a scalar by using the `scalar` keyword.

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
scalar Unreal<Type extends string>;
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
