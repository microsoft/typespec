---
jsApi: true
title: "[I] LinterRule"

---
Resolved instance of a linter rule that will run.

## Extends

- [`LinterRuleDefinition`](LinterRuleDefinition.md)<`N`, `DM`\>

## Type parameters

| Parameter |
| :------ |
| `N` extends `string` |
| `DM` extends [`DiagnosticMessages`](DiagnosticMessages.md) |

## Properties

| Property | Type | Description | Inheritance |
| :------ | :------ | :------ | :------ |
| `description` | `string` | - | [`LinterRuleDefinition`](LinterRuleDefinition.md).`description` |
| `id` | `string` | Expanded rule id in format `<library-name>:<rule-name>` | - |
| `messages` | `DM` | - | [`LinterRuleDefinition`](LinterRuleDefinition.md).`messages` |
| `name` | `N` | - | [`LinterRuleDefinition`](LinterRuleDefinition.md).`name` |
| `severity` | `"warning"` | - | [`LinterRuleDefinition`](LinterRuleDefinition.md).`severity` |

## Methods

### create()

```ts
create(context): SemanticNodeListener
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `context` | [`LinterRuleContext`](LinterRuleContext.md)<`DM`\> |

#### Inherited from

[`LinterRuleDefinition`](LinterRuleDefinition.md).[`create`](LinterRuleDefinition.md#create)
