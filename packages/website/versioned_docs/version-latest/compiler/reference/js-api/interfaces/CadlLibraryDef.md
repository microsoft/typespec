[JS Api](../index.md) / CadlLibraryDef

# Interface: CadlLibraryDef<T, E\>

Definition of a Cadl library

## Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends `Object` |
| `E` | extends `Record`<`string`, `any`\> = `Record`<`string`, `never`\> |

## Hierarchy

- **`CadlLibraryDef`**

  ↳ [`CadlLibrary`](CadlLibrary.md)

## Table of contents

### Properties

- [diagnostics](CadlLibraryDef.md#diagnostics)
- [emitter](CadlLibraryDef.md#emitter)
- [name](CadlLibraryDef.md#name)
- [requireImports](CadlLibraryDef.md#requireimports)

## Properties

### diagnostics

• `Readonly` **diagnostics**: [`DiagnosticMap`](../index.md#diagnosticmap)<`T`\>

Map of potential diagnostics that can be emitted in this library where the key is the diagnostic code.

___

### emitter

• `Optional` `Readonly` **emitter**: `Object`

Emitter configuration if library is an emitter.

#### Type declaration

| Name | Type |
| :------ | :------ |
| `options?` | [`JSONSchemaType`](../index.md#jsonschematype)<`E`\> |

___

### name

• `Readonly` **name**: `string`

Name of the library. Must match the package.json name.

___

### requireImports

• `Optional` `Readonly` **requireImports**: readonly `string`[]

List of other library that should be imported when this is used as an emitter.
Compiler will emit an error if the libraries are not explicitly imported.
