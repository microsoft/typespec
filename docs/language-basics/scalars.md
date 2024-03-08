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

Scalars can also support template parameters. However, it's important to note that these templates are primarily used for decorators.

```typespec
@doc(Type)
scalar Unreal<Type extends string>;
```
