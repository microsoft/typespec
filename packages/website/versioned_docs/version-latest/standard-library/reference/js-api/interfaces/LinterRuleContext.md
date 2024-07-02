---
jsApi: true
title: "[I] LinterRuleContext"

---
## Type parameters

| Type parameter |
| :------ |
| `DM` *extends* [`DiagnosticMessages`](DiagnosticMessages.md) |

## Properties

| Property | Modifier | Type |
| :------ | :------ | :------ |
| `program` | `readonly` | [`Program`](Program.md) |

## Methods

### reportDiagnostic()

```ts
reportDiagnostic<M>(diag): void
```

#### Type parameters

| Type parameter |
| :------ |
| `M` *extends* `string` \| `number` \| `symbol` |

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `diag` | [`LinterRuleDiagnosticReport`](../type-aliases/LinterRuleDiagnosticReport.md)<`DM`, `M`\> |

#### Returns

`void`
