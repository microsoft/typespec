---
title: Scalars
---

# Scalars

These are types without any fields(For example `string`, `int32`, `boolean`, etc.)

Scalar can be declared using the `scalar` keyword

```typespec
scalar ternary;
```

## Extend another scalar

Scalar can be extended using the `extends` keyword.

```typespec
scalar Password extends string;
```

## Template scalar

Scalar support template parameters. Note: the only use for those template are decorators.

```typespec
@doc(Type)
scalar Unreal<Type extends string>;
```
