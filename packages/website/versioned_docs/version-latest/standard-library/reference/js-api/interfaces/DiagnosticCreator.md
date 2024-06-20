---
jsApi: true
title: "[I] DiagnosticCreator"

---
## Type parameters

| Type parameter |
| :------ |
| `T` *extends* `object` |

## Properties

| Property | Modifier | Type |
| :------ | :------ | :------ |
| `diagnostics` | `readonly` | [`DiagnosticMap`](../type-aliases/DiagnosticMap.md)<`T`\> |
| `type` | `readonly` | `T` |

## Methods

### createDiagnostic()

```ts
createDiagnostic<C, M>(diag): Diagnostic
```

#### Type parameters

| Type parameter | Value |
| :------ | :------ |
| `C` *extends* `string` \| `number` \| `symbol` | - |
| `M` *extends* `string` \| `number` \| `symbol` | `"default"` |

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `diag` | [`DiagnosticReport`](../type-aliases/DiagnosticReport.md)<`T`, `C`, `M`\> |

#### Returns

[`Diagnostic`](Diagnostic.md)

***

### reportDiagnostic()

```ts
reportDiagnostic<C, M>(program, diag): void
```

#### Type parameters

| Type parameter | Value |
| :------ | :------ |
| `C` *extends* `string` \| `number` \| `symbol` | - |
| `M` *extends* `string` \| `number` \| `symbol` | `"default"` |

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `program` | [`Program`](Program.md) |
| `diag` | [`DiagnosticReport`](../type-aliases/DiagnosticReport.md)<`T`, `C`, `M`\> |

#### Returns

`void`
