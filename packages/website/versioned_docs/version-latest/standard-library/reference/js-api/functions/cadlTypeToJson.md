---
jsApi: true
title: "[F] cadlTypeToJson"

---
```ts
function cadlTypeToJson<T>(typespecType, target): [T | undefined, Diagnostic[]]
```

## Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `typespecType` | [`TypeSpecValue`](../type-aliases/TypeSpecValue.md) | The type to convert to Json data |
| `target` | [`DiagnosticTarget`](../type-aliases/DiagnosticTarget.md) | The diagnostic target in case of errors. |

## Returns

[`T` \| `undefined`, [`Diagnostic`](../interfaces/Diagnostic.md)[]]

## Deprecated

use typespecTypeToJson
