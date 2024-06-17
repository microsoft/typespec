---
jsApi: true
title: "[F] cadlTypeToJson"

---
```ts
function cadlTypeToJson<T>(typespecType, target): [T | undefined, Diagnostic[]]
```

## Type parameters

| Type parameter |
| :------ |
| `T` |

## Parameters

| Parameter | Type |
| :------ | :------ |
| `typespecType` | [`TypeSpecValue`](../type-aliases/TypeSpecValue.md) |
| `target` | [`DiagnosticTarget`](../type-aliases/DiagnosticTarget.md) |

## Returns

[`T` \| `undefined`, [`Diagnostic`](../interfaces/Diagnostic.md)[]]

## Deprecated

use typespecTypeToJson
