[JS Api](../index.md) / DiagnosticCreator

# Interface: DiagnosticCreator<T\>

## Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends `Object` |

## Table of contents

### Properties

- [diagnostics](DiagnosticCreator.md#diagnostics)
- [type](DiagnosticCreator.md#type)

### Methods

- [createDiagnostic](DiagnosticCreator.md#creatediagnostic)
- [reportDiagnostic](DiagnosticCreator.md#reportdiagnostic)

## Properties

### diagnostics

• `Readonly` **diagnostics**: [`DiagnosticMap`](../index.md#diagnosticmap)<`T`\>

___

### type

• `Readonly` **type**: `T`

## Methods

### createDiagnostic

▸ **createDiagnostic**<`C`, `M`\>(`diag`): [`Diagnostic`](Diagnostic.md)

#### Type parameters

| Name | Type |
| :------ | :------ |
| `C` | extends `string` \| `number` \| `symbol` |
| `M` | extends `string` \| `number` \| `symbol` = ``"default"`` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `diag` | [`DiagnosticReport`](../index.md#diagnosticreport)<`T`, `C`, `M`\> |

#### Returns

[`Diagnostic`](Diagnostic.md)

___

### reportDiagnostic

▸ **reportDiagnostic**<`C`, `M`\>(`program`, `diag`): `void`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `C` | extends `string` \| `number` \| `symbol` |
| `M` | extends `string` \| `number` \| `symbol` = ``"default"`` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | [`Program`](Program.md) |
| `diag` | [`DiagnosticReport`](../index.md#diagnosticreport)<`T`, `C`, `M`\> |

#### Returns

`void`
