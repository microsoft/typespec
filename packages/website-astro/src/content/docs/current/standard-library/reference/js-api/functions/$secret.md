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
| `context` | [`DecoratorContext`](../interfaces/DecoratorContext.md) | Decorator context |
| `target` | [`ModelProperty`](../interfaces/ModelProperty.md) \| [`Scalar`](../interfaces/Scalar.md) | Decorator target, either a string model or a property with type string. |
