---
jsApi: true
title: "[F] typespecTypeToJson"

---
```ts
typespecTypeToJson<T>(typespecType, target): [T | undefined, Diagnostic[]]
```

Convert a typespec type to a serializable Json object.
Emits diagnostics if the given type is invalid

## Type parameters

| Parameter |
| :------ |
| `T` |

## Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `typespecType` | [`TypeSpecValue`](Type.TypeSpecValue.md) | The type to convert to Json data |
| `target` | [`DiagnosticTarget`](Type.DiagnosticTarget.md) | The diagnostic target in case of errors. |

## Returns

[`T` \| `undefined`, [`Diagnostic`](Interface.Diagnostic.md)[]]
