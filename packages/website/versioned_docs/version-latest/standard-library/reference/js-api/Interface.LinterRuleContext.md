---
jsApi: true
title: "[I] LinterRuleContext"

---
## Type parameters

| Parameter |
| :------ |
| `DM` *extends* [`DiagnosticMessages`](Interface.DiagnosticMessages.md) |

## Properties

| Property | Type |
| :------ | :------ |
| `readonly` `program` | [`Program`](Interface.Program.md) |

## Methods

### reportDiagnostic

```ts
reportDiagnostic<M>(diag): void
```

#### Type parameters

| Parameter |
| :------ |
| `M` *extends* `string` \| `number` \| `symbol` |

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `diag` | [`LinterRuleDiagnosticReport`](Type.LinterRuleDiagnosticReport.md)< `DM`, `M` \> |

#### Returns

`void`
