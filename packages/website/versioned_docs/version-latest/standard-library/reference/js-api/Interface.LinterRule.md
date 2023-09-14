---
jsApi: true
title: "[I] LinterRule"

---
Resolved instance of a linter rule that will run.

## Extends

- [`LinterRuleDefinition`](Interface.LinterRuleDefinition.md)< `N`, `DM` \>

## Type parameters

| Parameter |
| :------ |
| `N` *extends* `string` |
| `DM` *extends* [`DiagnosticMessages`](Interface.DiagnosticMessages.md) |

## Properties

| Property | Type | Description |
| :------ | :------ | :------ |
| `description` | `string` | - |
| `id` | `string` | Expanded rule id in format `<library-name>:<rule-name>` |
| `messages` | `DM` | - |
| `name` | `N` | - |
| `severity` | `"warning"` | - |

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

#### Inherited from

[`LinterRuleDefinition`](Interface.LinterRuleDefinition.md).[`create`](Interface.LinterRuleDefinition.md#create)
