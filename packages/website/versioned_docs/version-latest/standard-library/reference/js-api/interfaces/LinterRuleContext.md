[JS Api](../index.md) / LinterRuleContext

# Interface: LinterRuleContext<DM\>

## Type parameters

| Name | Type |
| :------ | :------ |
| `DM` | extends [`DiagnosticMessages`](DiagnosticMessages.md) |

## Table of contents

### Properties

- [program](LinterRuleContext.md#program)

### Methods

- [reportDiagnostic](LinterRuleContext.md#reportdiagnostic)

## Properties

### program

• `Readonly` **program**: [`Program`](Program.md)

## Methods

### reportDiagnostic

▸ **reportDiagnostic**<`M`\>(`diag`): `void`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `M` | extends `string` \| `number` \| `symbol` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `diag` | [`LinterRuleDiagnosticReport`](../index.md#linterrulediagnosticreport)<`DM`, `M`\> |

#### Returns

`void`
