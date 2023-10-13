---
jsApi: true
title: "[I] LinterRuleContext"

---
## Type parameters

| Parameter |
| :------ |
| `DM` extends [`DiagnosticMessages`](DiagnosticMessages.md) |

## Properties

| Modifier | Property | Type | Description |
| :------ | :------ | :------ | :------ |
| `readonly` | `program` | [`Program`](Program.md) | - |

## Methods

### reportDiagnostic()

```ts
reportDiagnostic<M>(diag): void
```

#### Type parameters

| Parameter |
| :------ |
| `M` extends `string` \| `number` \| `symbol` |

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `diag` | [`LinterRuleDiagnosticReport`](../type-aliases/LinterRuleDiagnosticReport.md)<`DM`, `M`\> |
