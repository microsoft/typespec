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
| `description` | `string` | Short description of the rule | [`LinterRuleDefinition.description`](LinterRuleDefinition.md) |
| `id` | `string` | Expanded rule id in format `<library-name>:<rule-name>` | - |
| `messages` | `DM` | Messages that can be reported with the diagnostic. | [`LinterRuleDefinition.messages`](LinterRuleDefinition.md) |
| `name` | `N` | Rule name (without the library name) | [`LinterRuleDefinition.name`](LinterRuleDefinition.md) |
| `severity` | `"warning"` | Rule default severity. | [`LinterRuleDefinition.severity`](LinterRuleDefinition.md) |
| `url?` | `string` | Specifies the URL at which the full documentation can be accessed. | [`LinterRuleDefinition.url`](LinterRuleDefinition.md) |

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

#### Inherited from

[`LinterRuleDefinition.create`](LinterRuleDefinition.md#create)
