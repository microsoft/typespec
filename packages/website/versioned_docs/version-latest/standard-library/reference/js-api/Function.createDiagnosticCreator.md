---
jsApi: true
title: "[F] createDiagnosticCreator"

---
```ts
createDiagnosticCreator<T>(diagnostics, libraryName?): DiagnosticCreator< T >
```

Create a new diagnostics creator.

## Type parameters

| Parameter |
| :------ |
| `T` *extends* \{} |

## Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `diagnostics` | [`DiagnosticMap`](Type.DiagnosticMap.md)< `T` \> | Map of the potential diagnostics. |
| `libraryName`? | `string` | Optional name of the library if in the scope of a library. |

## Returns

[`DiagnosticCreator`](Interface.DiagnosticCreator.md)< `T` \>

## See

DiagnosticCreator
