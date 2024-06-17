---
jsApi: true
title: "[F] $deprecated"

---
```ts
function $deprecated(
   context, 
   target, 
   message): void
```

Mark a type as deprecated

## Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `context` | [`DecoratorContext`](../interfaces/DecoratorContext.md) | DecoratorContext |
| `target` | [`Type`](../type-aliases/Type.md) | Decorator target |
| `message` | `string` | Deprecation target. |

## Returns

`void`

## Example

``` @deprecated("Foo is deprecated, use Bar instead.")
    model Foo {}
```
