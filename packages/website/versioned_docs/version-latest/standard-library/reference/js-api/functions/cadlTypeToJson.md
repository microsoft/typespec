---
jsApi: true
title: "[F] cadlTypeToJson"

---
```ts
function cadlTypeToJson<T>(typespecType, target): [T | undefined, Diagnostic[]]
```

Convert a TypeSpec type to a serializable Json object.
Emits diagnostics if the given type is invalid

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
