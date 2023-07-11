[JS Api](../index.md) / TypeSpecLibraryDef

# Interface: TypeSpecLibraryDef<T, E\>

Definition of a TypeSpec library

## Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends `Object` |
| `E` | extends `Record`<`string`, `any`\> = `Record`<`string`, `never`\> |

## Hierarchy

- **`TypeSpecLibraryDef`**

  ↳ [`TypeSpecLibrary`](TypeSpecLibrary.md)

## Table of contents

### Properties

- [diagnostics](TypeSpecLibraryDef.md#diagnostics)
- [emitter](TypeSpecLibraryDef.md#emitter)
- [linter](TypeSpecLibraryDef.md#linter)
- [name](TypeSpecLibraryDef.md#name)
- [requireImports](TypeSpecLibraryDef.md#requireimports)

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

### linter

• `Optional` `Readonly` **linter**: [`LinterDefinition`](LinterDefinition.md)

Configuration if library is providing linting rules/rulesets.

___

### name

• `Readonly` **name**: `string`

Name of the library. Must match the package.json name.

___

### requireImports

• `Optional` `Readonly` **requireImports**: readonly `string`[]

List of other library that should be imported when this is used as an emitter.
Compiler will emit an error if the libraries are not explicitly imported.
