---
jsApi: true
title: "[F] $key"

---
```ts
$key(
  context,
  entity,
  altName?): void
```

`@key` - mark a model property as the key to identify instances of that type

The optional first argument accepts an alternate key name which may be used by emitters.
Otherwise, the name of the target property will be used.

`@key` can only be applied to model properties.

## Parameters

| Parameter | Type |
| :------ | :------ |
| `context` | [`DecoratorContext`](Interface.DecoratorContext.md) |
| `entity` | [`ModelProperty`](Interface.ModelProperty.md) |
| `altName`? | `string` |

## Returns

`void`
