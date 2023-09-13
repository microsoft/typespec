---
jsApi: true
title: "[I] DiagnosticCreator"

---
## Type parameters

| Parameter |
| :------ |
| `T` *extends* \{} |

## Properties

| Property | Type |
| :------ | :------ |
| `readonly` `diagnostics` | [`DiagnosticMap`](Type.DiagnosticMap.md)< `T` \> |
| `readonly` `type` | `T` |

## Methods

### createDiagnostic

```ts
createDiagnostic<C, M>(diag): Diagnostic
```

#### Type parameters

| Parameter | Default |
| :------ | :------ |
| `C` *extends* `string` \| `number` \| `symbol` | - |
| `M` *extends* `string` \| `number` \| `symbol` | `"default"` |

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `diag` | [`DiagnosticReport`](Type.DiagnosticReport.md)< `T`, `C`, `M` \> |

#### Returns

[`Diagnostic`](Interface.Diagnostic.md)

***

### reportDiagnostic

```ts
reportDiagnostic<C, M>(program, diag): void
```

#### Type parameters

| Parameter | Default |
| :------ | :------ |
| `C` *extends* `string` \| `number` \| `symbol` | - |
| `M` *extends* `string` \| `number` \| `symbol` | `"default"` |

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `program` | [`Program`](Interface.Program.md) |
| `diag` | [`DiagnosticReport`](Type.DiagnosticReport.md)< `T`, `C`, `M` \> |

#### Returns

`void`
