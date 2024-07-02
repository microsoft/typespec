---
jsApi: true
title: "[F] createRule"

---
```ts
function createRule<N, T>(definition): LinterRuleDefinition<N, T>
```

Create a new linter rule.

## Type parameters

| Type parameter |
| :------ |
| `N` *extends* `string` |
| `T` *extends* [`DiagnosticMessages`](../interfaces/DiagnosticMessages.md) |

## Parameters

| Parameter | Type |
| :------ | :------ |
| `definition` | [`LinterRuleDefinition`](../interfaces/LinterRuleDefinition.md)<`N`, `T`\> |

## Returns

[`LinterRuleDefinition`](../interfaces/LinterRuleDefinition.md)<`N`, `T`\>
