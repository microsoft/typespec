---
jsApi: true
title: "[F] getMaxLengthAsNumeric"

---
```ts
function getMaxLengthAsNumeric(program, target): Numeric | undefined
```

Get the minimum length of a string type as a [Numeric](Numeric.md) value.

## Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `program` | [`Program`](../interfaces/Program.md) | Current program |
| `target` | [`Type`](../type-aliases/Type.md) | Type with the `@maxLength` decorator |

## Returns

[`Numeric`](../interfaces/Numeric.md) \| `undefined`
