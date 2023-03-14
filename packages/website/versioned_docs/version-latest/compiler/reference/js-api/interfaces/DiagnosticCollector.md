[JS Api](../index.md) / DiagnosticCollector

# Interface: DiagnosticCollector

Helper object to collect diagnostics from function following the diagnostics accessor pattern(foo() => [T, Diagnostic[]])

## Table of contents

### Properties

- [diagnostics](DiagnosticCollector.md#diagnostics)

### Methods

- [add](DiagnosticCollector.md#add)
- [pipe](DiagnosticCollector.md#pipe)
- [wrap](DiagnosticCollector.md#wrap)

## Properties

### diagnostics

• `Readonly` **diagnostics**: readonly [`Diagnostic`](Diagnostic.md)[]

## Methods

### add

▸ **add**(`diagnostic`): `void`

Add a diagnostic to the collection

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `diagnostic` | [`Diagnostic`](Diagnostic.md) | Diagnostic to add. |

#### Returns

`void`

___

### pipe

▸ **pipe**<`T`\>(`result`): `T`

Unwrap the Diagnostic result, add all the diagnostics and return the data.

#### Type parameters

| Name |
| :------ |
| `T` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `result` | [`DiagnosticResult`](../index.md#diagnosticresult)<`T`\> | Accessor diagnostic result |

#### Returns

`T`

___

### wrap

▸ **wrap**<`T`\>(`value`): [`DiagnosticResult`](../index.md#diagnosticresult)<`T`\>

Wrap the given value in a tuple including the diagnostics following the TypeSpec accessor pattern.

**`Example`**

```ts
return diagnostics.wrap(routes);
```

#### Type parameters

| Name |
| :------ |
| `T` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `value` | `T` | Accessor value to return |

#### Returns

[`DiagnosticResult`](../index.md#diagnosticresult)<`T`\>
