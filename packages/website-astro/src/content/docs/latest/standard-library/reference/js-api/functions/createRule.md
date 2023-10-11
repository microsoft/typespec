---
jsApi: true
title: "[F] createRule"

---
```ts
createRule<N, T>(definition): LinterRuleDefinition<N, T>
```

Create a new linter rule.

## Type parameters

| Parameter |
| :------ |
| `N` extends `string` |
| `T` extends [`DiagnosticMessages`](../interfaces/DiagnosticMessages.md) |

## Parameters

| Parameter | Type |
| :------ | :------ |
| `definition` | [`LinterRuleDefinition`](../interfaces/LinterRuleDefinition.md)<`N`, `T`\> |
