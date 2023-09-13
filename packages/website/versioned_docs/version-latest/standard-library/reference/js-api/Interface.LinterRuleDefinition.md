---
jsApi: true
title: "[I] LinterRuleDefinition"

---
## Extended By

- [`LinterRule`](Interface.LinterRule.md)

## Type parameters

| Parameter |
| :------ |
| `N` *extends* `string` |
| `DM` *extends* [`DiagnosticMessages`](Interface.DiagnosticMessages.md) |

## Properties

| Property | Type |
| :------ | :------ |
| `description` | `string` |
| `messages` | `DM` |
| `name` | `N` |
| `severity` | `"warning"` |

## Methods

### create

```ts
create(context): SemanticNodeListener
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `context` | [`LinterRuleContext`](Interface.LinterRuleContext.md)< `DM` \> |

#### Returns

[`SemanticNodeListener`](Type.SemanticNodeListener.md)
