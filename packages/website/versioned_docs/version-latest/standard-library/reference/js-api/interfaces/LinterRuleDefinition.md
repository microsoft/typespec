[JS Api](../index.md) / LinterRuleDefinition

# Interface: LinterRuleDefinition<N, DM\>

## Type parameters

| Name | Type |
| :------ | :------ |
| `N` | extends `string` |
| `DM` | extends [`DiagnosticMessages`](DiagnosticMessages.md) |

## Hierarchy

- **`LinterRuleDefinition`**

  ↳ [`LinterRule`](LinterRule.md)

## Table of contents

### Properties

- [description](LinterRuleDefinition.md#description)
- [messages](LinterRuleDefinition.md#messages)
- [name](LinterRuleDefinition.md#name)
- [severity](LinterRuleDefinition.md#severity)

### Methods

- [create](LinterRuleDefinition.md#create)

## Properties

### description

• **description**: `string`

___

### messages

• **messages**: `DM`

___

### name

• **name**: `N`

___

### severity

• **severity**: ``"warning"``

## Methods

### create

▸ **create**(`context`): [`SemanticNodeListener`](../index.md#semanticnodelistener)

#### Parameters

| Name | Type |
| :------ | :------ |
| `context` | [`LinterRuleContext`](LinterRuleContext.md)<`DM`\> |

#### Returns

[`SemanticNodeListener`](../index.md#semanticnodelistener)
