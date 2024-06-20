---
jsApi: true
title: "[F] getMinLengthAsNumeric"

---
```ts
function getMinLengthAsNumeric(program, target): Numeric | undefined
```

Get the minimum length of a string type as a [Numeric](Numeric.md) value.

## Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `program` | [`Program`](../interfaces/Program.md) | Current program |
| `target` | [`Type`](../type-aliases/Type.md) | Type with the `@minLength` decorator |

## Returns

[`Numeric`](../interfaces/Numeric.md) \| `undefined`
