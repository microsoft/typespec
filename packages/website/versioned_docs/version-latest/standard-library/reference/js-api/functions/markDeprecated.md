---
jsApi: true
title: "[F] markDeprecated"

---
```ts
markDeprecated(
   program, 
   type, 
   details): void
```

Mark the given type as deprecated with the provided details.

## Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `program` | [`Program`](../interfaces/Program.md) | Program |
| `type` | [`Type`](../type-aliases/Type.md) | Type |
| `details` | [`DeprecationDetails`](../interfaces/DeprecationDetails.md) | Details of the deprecation |
