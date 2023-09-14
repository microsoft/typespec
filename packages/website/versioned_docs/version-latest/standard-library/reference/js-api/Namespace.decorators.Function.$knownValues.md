---
jsApi: true
title: "[F] $knownValues"

---
```ts
$knownValues(
  context,
  target,
  knownValues): void
```

`@knownValues` marks a string type with an enum that contains all known values

The first parameter is a reference to an enum type that describes all possible values that the
type accepts.

`@knownValues` can only be applied to model types that extend `string`.

## Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `context` | [`DecoratorContext`](Interface.DecoratorContext.md) | - |
| `target` | [`ModelProperty`](Interface.ModelProperty.md) \| [`Scalar`](Interface.Scalar.md) | Decorator target. Must be a string. (model Foo extends string) |
| `knownValues` | [`Enum`](Interface.Enum.md) | Must be an enum. |

## Returns

`void`
