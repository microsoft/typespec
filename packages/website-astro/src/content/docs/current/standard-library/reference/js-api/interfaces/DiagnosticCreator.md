---
jsApi: true
title: "[I] DiagnosticCreator"

---
## Type parameters

| Parameter |
| :------ |
| `T` extends `object` |

## Properties

| Modifier | Property | Type | Description |
| :------ | :------ | :------ | :------ |
| `readonly` | `diagnostics` | [`DiagnosticMap`](../type-aliases/DiagnosticMap.md)<`T`\> | - |
| `readonly` | `type` | `T` | - |

## Methods

### createDiagnostic()

```ts
createDiagnostic<C, M>(diag): Diagnostic
```

#### Type parameters

| Parameter | Default |
| :------ | :------ |
| `C` extends `string` \| `number` \| `symbol` | - |
| `M` extends `string` \| `number` \| `symbol` | `"default"` |

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `diag` | [`DiagnosticReport`](../type-aliases/DiagnosticReport.md)<`T`, `C`, `M`\> |

***

### reportDiagnostic()

```ts
reportDiagnostic<C, M>(program, diag): void
```

#### Type parameters

| Parameter | Default |
| :------ | :------ |
| `C` extends `string` \| `number` \| `symbol` | - |
| `M` extends `string` \| `number` \| `symbol` | `"default"` |

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `program` | [`Program`](Program.md) |
| `diag` | [`DiagnosticReport`](../type-aliases/DiagnosticReport.md)<`T`, `C`, `M`\> |
