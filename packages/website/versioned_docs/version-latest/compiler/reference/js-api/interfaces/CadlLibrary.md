[JS Api](../index.md) / CadlLibrary

# Interface: CadlLibrary<T, E\>

Definition of a Cadl library

## Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends `Object` |
| `E` | extends `Record`<`string`, `any`\> = `Record`<`string`, `never`\> |

## Hierarchy

- [`CadlLibraryDef`](CadlLibraryDef.md)<`T`, `E`\>

  ↳ **`CadlLibrary`**

## Table of contents

### Properties

- [diagnostics](CadlLibrary.md#diagnostics)
- [emitter](CadlLibrary.md#emitter)
- [emitterOptionValidator](CadlLibrary.md#emitteroptionvalidator)
- [name](CadlLibrary.md#name)
- [requireImports](CadlLibrary.md#requireimports)

### Methods

- [createDiagnostic](CadlLibrary.md#creatediagnostic)
- [createStateSymbol](CadlLibrary.md#createstatesymbol)
- [getTracer](CadlLibrary.md#gettracer)
- [reportDiagnostic](CadlLibrary.md#reportdiagnostic)

## Properties

### diagnostics

• `Readonly` **diagnostics**: [`DiagnosticMap`](../index.md#diagnosticmap)<`T`\>

Map of potential diagnostics that can be emitted in this library where the key is the diagnostic code.

#### Inherited from

[CadlLibraryDef](CadlLibraryDef.md).[diagnostics](CadlLibraryDef.md#diagnostics)

___

### emitter

• `Optional` `Readonly` **emitter**: `Object`

Emitter configuration if library is an emitter.

#### Type declaration

| Name | Type |
| :------ | :------ |
| `options?` | [`JSONSchemaType`](../index.md#jsonschematype)<`E`\> |

#### Inherited from

[CadlLibraryDef](CadlLibraryDef.md).[emitter](CadlLibraryDef.md#emitter)

___

### emitterOptionValidator

• `Optional` `Readonly` **emitterOptionValidator**: [`JSONSchemaValidator`](JSONSchemaValidator.md)

JSON Schema validator for emitter options

___

### name

• `Readonly` **name**: `string`

Name of the library. Must match the package.json name.

#### Inherited from

[CadlLibraryDef](CadlLibraryDef.md).[name](CadlLibraryDef.md#name)

___

### requireImports

• `Optional` `Readonly` **requireImports**: readonly `string`[]

List of other library that should be imported when this is used as an emitter.
Compiler will emit an error if the libraries are not explicitly imported.

#### Inherited from

[CadlLibraryDef](CadlLibraryDef.md).[requireImports](CadlLibraryDef.md#requireimports)

## Methods

### createDiagnostic

▸ **createDiagnostic**<`C`, `M`\>(`diag`): [`Diagnostic`](Diagnostic.md)

#### Type parameters

| Name | Type |
| :------ | :------ |
| `C` | extends `string` \| `number` \| `symbol` |
| `M` | extends `string` \| `number` \| `symbol` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `diag` | [`DiagnosticReport`](../index.md#diagnosticreport)<`T`, `C`, `M`\> |

#### Returns

[`Diagnostic`](Diagnostic.md)

___

### createStateSymbol

▸ **createStateSymbol**(`name`): `symbol`

Get or create a symbol with the given name unique for that library.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `name` | `string` | Symbol name scoped with the library name. |

#### Returns

`symbol`

___

### getTracer

▸ **getTracer**(`program`): [`Tracer`](Tracer.md)

Returns a tracer scopped to the current library.
All trace area logged via this tracer will be prefixed with the library name.

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | [`Program`](Program.md) |

#### Returns

[`Tracer`](Tracer.md)

___

### reportDiagnostic

▸ **reportDiagnostic**<`C`, `M`\>(`program`, `diag`): `void`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `C` | extends `string` \| `number` \| `symbol` |
| `M` | extends `string` \| `number` \| `symbol` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | [`Program`](Program.md) |
| `diag` | [`DiagnosticReport`](../index.md#diagnosticreport)<`T`, `C`, `M`\> |

#### Returns

`void`
