---
jsApi: true
title: "[I] TypeSpecLibraryDef"

---
## Extended By

- [`TypeSpecLibrary`](TypeSpecLibrary.md)

## Type parameters

| Parameter | Value |
| :------ | :------ |
| `T` extends `Object` | - |
| `E` extends `Record`<`string`, `any`\> | `Record`<`string`, `never`\> |
| `State` extends `string` | `never` |

## Properties

| Modifier | Property | Type | Description |
| :------ | :------ | :------ | :------ |
| `readonly` | `diagnostics` | [`DiagnosticMap`](../type-aliases/DiagnosticMap.md)<`T`\> | Map of potential diagnostics that can be emitted in this library where the key is the diagnostic code. |
| `readonly` | `emitter?` | `Object` | Emitter configuration if library is an emitter. |
| `readonly` | `emitter.options?` | [`JSONSchemaType`](../type-aliases/JSONSchemaType.md)<`E`\> | - |
| `readonly` | ~~`linter?`~~ | [`LinterDefinition`](LinterDefinition.md) | Configuration if library is providing linting rules/rulesets.<br /><br />**Deprecated**<br />Use `export const $linter` instead. This will cause circular reference with linters. |
| `readonly` | `name` | `string` | Library name. MUST match package.json name. |
| `readonly` | `requireImports?` | readonly `string`[] | List of other library that should be imported when this is used as an emitter.<br />Compiler will emit an error if the libraries are not explicitly imported. |
| `public` | `state?` | `Record`<`State`, [`StateDef`](StateDef.md)\> | - |
