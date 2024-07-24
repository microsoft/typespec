---
jsApi: true
title: "[I] TypeSpecLibraryDef"

---
## Extended by

- [`TypeSpecLibrary`](TypeSpecLibrary.md)

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` *extends* `object` | - |
| `E` *extends* `Record`<`string`, `any`\> | `Record`<`string`, `never`\> |
| `State` *extends* `string` | `never` |

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| `diagnostics` | `readonly` | [`DiagnosticMap`](../type-aliases/DiagnosticMap.md)<`T`\> | Map of potential diagnostics that can be emitted in this library where the key is the diagnostic code. |
| `emitter?` | `readonly` | `object` | Emitter configuration if library is an emitter. |
| `emitter.options?` | `public` | [`JSONSchemaType`](../type-aliases/JSONSchemaType.md)<`E`\> | - |
| ~~`linter?`~~ | `readonly` | [`LinterDefinition`](LinterDefinition.md) | Configuration if library is providing linting rules/rulesets. **Deprecated** Use `export const $linter` instead. This will cause circular reference with linters. |
| `name` | `readonly` | `string` | Library name. MUST match package.json name. |
| `requireImports?` | `readonly` | readonly `string`[] | List of other library that should be imported when this is used as an emitter. Compiler will emit an error if the libraries are not explicitly imported. |
| `state?` | `readonly` | `Record`<`State`, [`StateDef`](StateDef.md)\> | - |
