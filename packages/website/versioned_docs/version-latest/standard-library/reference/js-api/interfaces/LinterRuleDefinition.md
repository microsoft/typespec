---
jsApi: true
title: "[I] LinterRuleDefinition"

---
## Extended by

- [`LinterRule`](LinterRule.md)

## Type parameters

| Type parameter |
| :------ |
| `N` *extends* `string` |
| `DM` *extends* [`DiagnosticMessages`](DiagnosticMessages.md) |

## Properties

| Property | Type | Description |
| :------ | :------ | :------ |
| `description` | `string` | Short description of the rule |
| `messages` | `DM` | Messages that can be reported with the diagnostic. |
| `name` | `N` | Rule name (without the library name) |
| `severity` | `"warning"` | Rule default severity. |
| `url?` | `string` | Specifies the URL at which the full documentation can be accessed. |

## Methods

### create()

```ts
create(context): SemanticNodeListener
```

Creator

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `context` | [`LinterRuleContext`](LinterRuleContext.md)<`DM`\> |

#### Returns

[`SemanticNodeListener`](../type-aliases/SemanticNodeListener.md)
