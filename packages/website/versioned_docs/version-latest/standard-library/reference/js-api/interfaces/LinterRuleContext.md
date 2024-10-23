---
jsApi: true
title: "[I] LinterRuleContext"

---
## Type Parameters

| Type Parameter |
| ------ |
| `DM` *extends* [`DiagnosticMessages`](DiagnosticMessages.md) |

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| `program` | `readonly` | [`Program`](Program.md) |

## Methods

### reportDiagnostic()

```ts
reportDiagnostic<M>(diag): void
```

#### Type Parameters

| Type Parameter |
| ------ |
| `M` *extends* `string` \| `number` \| `symbol` |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `diag` | [`LinterRuleDiagnosticReport`](../type-aliases/LinterRuleDiagnosticReport.md)<`DM`, `M`\> |

#### Returns

`void`
