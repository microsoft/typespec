---
jsApi: true
title: "[I] LinterRuleDefinition"

---
## Extended By

- [`LinterRule`](LinterRule.md)

## Type parameters

| Parameter |
| :------ |
| `N` extends `string` |
| `DM` extends [`DiagnosticMessages`](DiagnosticMessages.md) |

## Properties

| Property | Type | Description |
| :------ | :------ | :------ |
| `description` | `string` | - |
| `messages` | `DM` | - |
| `name` | `N` | - |
| `severity` | `"warning"` | - |

## Methods

### create()

```ts
create(context): SemanticNodeListener
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `context` | [`LinterRuleContext`](LinterRuleContext.md)<`DM`\> |
