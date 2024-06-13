---
jsApi: true
title: "[I] LinterRule"

---
Resolved instance of a linter rule that will run.

## Extends

- [`LinterRuleDefinition`](LinterRuleDefinition.md)<`N`, `DM`\>

## Type parameters

| Type parameter |
| :------ |
| `N` *extends* `string` |
| `DM` *extends* [`DiagnosticMessages`](DiagnosticMessages.md) |

## Properties

| Property | Type | Description | Inherited from |
| :------ | :------ | :------ | :------ |
| `description` | `string` | Short description of the rule | [`LinterRuleDefinition`](LinterRuleDefinition.md).`description` |
| `id` | `string` | Expanded rule id in format `<library-name>:<rule-name>` | - |
| `messages` | `DM` | Messages that can be reported with the diagnostic. | [`LinterRuleDefinition`](LinterRuleDefinition.md).`messages` |
| `name` | `N` | Rule name (without the library name) | [`LinterRuleDefinition`](LinterRuleDefinition.md).`name` |
| `severity` | `"warning"` | Rule default severity. | [`LinterRuleDefinition`](LinterRuleDefinition.md).`severity` |
| `url?` | `string` | Specifies the URL at which the full documentation can be accessed. | [`LinterRuleDefinition`](LinterRuleDefinition.md).`url` |

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

[`LinterRuleDefinition`](LinterRuleDefinition.md).[`create`](LinterRuleDefinition.md#create)
