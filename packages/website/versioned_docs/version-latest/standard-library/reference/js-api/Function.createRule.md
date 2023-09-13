---
jsApi: true
title: "[F] createRule"

---
```ts
createRule<N, T>(definition): LinterRuleDefinition< N, T >
```

Create a new linter rule.

## Type parameters

| Parameter |
| :------ |
| `N` *extends* `string` |
| `T` *extends* [`DiagnosticMessages`](Interface.DiagnosticMessages.md) |

## Parameters

| Parameter | Type |
| :------ | :------ |
| `definition` | [`LinterRuleDefinition`](Interface.LinterRuleDefinition.md)< `N`, `T` \> |

## Returns

[`LinterRuleDefinition`](Interface.LinterRuleDefinition.md)< `N`, `T` \>
