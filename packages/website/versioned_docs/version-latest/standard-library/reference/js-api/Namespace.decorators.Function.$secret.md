---
jsApi: true
title: "[F] $secret"

---
```ts
$secret(context, target): void
```

Mark a string as a secret value that should be treated carefully to avoid exposure

## Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `context` | [`DecoratorContext`](Interface.DecoratorContext.md) | Decorator context |
| `target` | [`ModelProperty`](Interface.ModelProperty.md) \| [`Scalar`](Interface.Scalar.md) | Decorator target, either a string model or a property with type string. |

## Returns

`void`
