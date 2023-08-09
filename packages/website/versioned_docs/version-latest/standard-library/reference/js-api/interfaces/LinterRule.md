[JS Api](../index.md) / LinterRule

# Interface: LinterRule<N, DM\>

Resolved instance of a linter rule that will run.

## Type parameters

| Name | Type |
| :------ | :------ |
| `N` | extends `string` |
| `DM` | extends [`DiagnosticMessages`](DiagnosticMessages.md) |

## Hierarchy

- [`LinterRuleDefinition`](LinterRuleDefinition.md)<`N`, `DM`\>

  ↳ **`LinterRule`**

## Table of contents

### Properties

- [description](LinterRule.md#description)
- [id](LinterRule.md#id)
- [messages](LinterRule.md#messages)
- [name](LinterRule.md#name)
- [severity](LinterRule.md#severity)

### Methods

- [create](LinterRule.md#create)

## Properties

### description

• **description**: `string`

#### Inherited from

[LinterRuleDefinition](LinterRuleDefinition.md).[description](LinterRuleDefinition.md#description)

___

### id

• **id**: `string`

Expanded rule id in format `<library-name>:<rule-name>`

___

### messages

• **messages**: `DM`

#### Inherited from

[LinterRuleDefinition](LinterRuleDefinition.md).[messages](LinterRuleDefinition.md#messages)

___

### name

• **name**: `N`

#### Inherited from

[LinterRuleDefinition](LinterRuleDefinition.md).[name](LinterRuleDefinition.md#name)

___

### severity

• **severity**: ``"warning"``

#### Inherited from

[LinterRuleDefinition](LinterRuleDefinition.md).[severity](LinterRuleDefinition.md#severity)

## Methods

### create

▸ **create**(`context`): [`SemanticNodeListener`](../index.md#semanticnodelistener)

#### Parameters

| Name | Type |
| :------ | :------ |
| `context` | [`LinterRuleContext`](LinterRuleContext.md)<`DM`\> |

#### Returns

[`SemanticNodeListener`](../index.md#semanticnodelistener)

#### Inherited from

[LinterRuleDefinition](LinterRuleDefinition.md).[create](LinterRuleDefinition.md#create)
